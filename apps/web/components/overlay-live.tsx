'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { io } from 'socket.io-client';
import { apiGet } from '../lib/api';
import type { OverlayCustomization, WidgetDefinition } from '@horse-timer/types';
import { DEFAULT_PUBLIC_API_BASE_URL } from '../lib/runtime-config';
import { formatDisplayTimer } from '../lib/timer-state';

type OverlayPayload = {
  timerState: string;
  stateLabel: string;
  riderName: string;
  horseName: string;
  className: string;
  competitorNumber: string;
  elapsedMs: number;
  penalties: string;
  sponsorName: string;
  logoUrl: string;
  snapshot?: {
    state: string;
    context: {
      warmupStartedAt?: string | null;
      mainStartedAt?: string | null;
      mainEndsAt?: string | null;
      completedAt?: string | null;
    };
  };
};

const API_BASE = DEFAULT_PUBLIC_API_BASE_URL;

export function OverlayLive({
  mode = 'broadcast',
  desktopShell = false,
  widgetId,
}: {
  mode?: 'broadcast' | 'widget';
  desktopShell?: boolean;
  widgetId?: string;
}) {
  const [overlay, setOverlay] = useState<OverlayPayload | null>(null);
  const [config, setConfig] = useState<OverlayCustomization | null>(null);
  const [widget, setWidget] = useState<WidgetDefinition | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [bounds, setBounds] = useState({ width: 1200, height: 420 });
  const [fitScale, setFitScale] = useState(1);
  const cardRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadOverlayState() {
      const [overlayState, overlayConfig, widgetConfig] = await Promise.all([
        apiGet<OverlayPayload>('/overlay/state.json'),
        apiGet<OverlayCustomization>('/overlay/config.json'),
        widgetId ? apiGet<WidgetDefinition | null>(`/settings/widgets/${widgetId}`) : Promise.resolve(null),
      ]);

      if (!mounted) {
        return;
      }

      setOverlay(overlayState);
      setConfig(overlayConfig);
      if (widgetId) {
        setWidget(widgetConfig);
      }
    }

    void loadOverlayState();
    const socket = io(API_BASE);
    socket.on('overlay.updated', () => {
      void loadOverlayState();
    });
    const interval = window.setInterval(() => {
      void loadOverlayState();
    }, widgetId ? 750 : 2000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
      socket.close();
    };
  }, [widgetId]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const element = cardRef.current;
    if (!element) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      setBounds({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [config?.layout]);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      const naturalWidth = content.scrollWidth || bounds.width;
      const naturalHeight = content.scrollHeight || bounds.height;
      const widthScale = bounds.width / naturalWidth;
      const heightScale = bounds.height / naturalHeight;
      const nextScale = Math.min(1.22, widthScale, heightScale);
      setFitScale(Number.isFinite(nextScale) ? Math.max(0.34, nextScale) : 1);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [bounds, overlay, config, now]);

  const timer = formatDisplayTimer(overlay?.snapshot ?? null, overlay?.elapsedMs ?? 0, now);
  const isWidget = mode === 'widget' || config?.layout === 'WIDGET';
  const widgetIsTimer = !widgetId || widget?.kind === 'TIMER' || !widget;
  const dragStyle = desktopShell ? ({ WebkitAppRegion: 'drag' } as CSSProperties & Record<string, string>) : {};
  const compactHeight = bounds.height <= 240;
  const tightHeight = bounds.height <= 190;
  const narrowWidth = bounds.width <= 540;
  const stackLayout = bounds.width <= (config?.stackBelowWidth ?? 760) || (compactHeight && bounds.width <= 860);
  const collapseMeta = bounds.width <= (config?.collapseMetaBelowWidth ?? 560) || compactHeight;
  const showSponsor = config?.showSponsor !== false;
  const showLogo = config?.showLogo !== false;
  const computedScale = config?.autoScale
    ? Math.max(
        config?.minFontScale ?? 0.72,
        Math.min(
          config?.maxFontScale ?? 1.12,
          Math.min(bounds.width / 920, bounds.height / 320) * (config?.fontScale ?? 1),
        ),
      )
    : (config?.fontScale ?? 1);
  const alignCenter = config?.timerAlign === 'CENTER';
  const textColor = config?.textColor ?? '#fbfdff';
  const basePaddingX = config?.paddingX ?? (isWidget ? 18 : 34);
  const basePaddingY = config?.paddingY ?? (isWidget ? 18 : 34);
  const paddingX = Math.max(6, Math.min(basePaddingX, Math.round(bounds.width * 0.055)));
  const paddingY = Math.max(6, Math.min(basePaddingY, Math.round(bounds.height * 0.1)));
  const baseGap = config?.contentGap ?? 24;
  const gap = Math.max(8, Math.min(baseGap, Math.round(Math.min(bounds.width, bounds.height) * 0.065)));
  const useInlineMeta = isWidget || config?.compactMetaMode === 'INLINE' || (config?.compactMetaMode !== 'STACK' && collapseMeta);
  const timerSizeRem = Math.max(2.4, Math.min(8.4, 5.5 * computedScale + (tightHeight ? -0.2 : 0)));
  const headlineSizeRem = Math.max(1.08, Math.min(2.45, 2.02 * computedScale + (tightHeight ? -0.08 : 0)));
  const sublineSizeRem = Math.max(0.88, Math.min(1.42, 1.16 * computedScale));
  const metaValueSizeRem = Math.max(0.92, Math.min(1.46, 1.08 * computedScale));
  const metaLabelSizeRem = Math.max(0.66, Math.min(0.82, 0.7 * computedScale));
  const summaryColumnMin = narrowWidth ? Math.max(90, Math.floor(bounds.width * 0.32)) : 104;
  const summaryItems = [
    { label: 'Bib', value: overlay?.competitorNumber ?? '--' },
    ...(config?.showClassName !== false ? [{ label: 'Class', value: overlay?.className ?? 'Awaiting class' }] : []),
    ...(config?.showHorseName !== false ? [{ label: 'Horse', value: overlay?.horseName ?? 'Awaiting horse' }] : []),
    ...(config?.showPenalties !== false ? [{ label: 'Pen', value: overlay?.penalties ?? '0' }] : []),
    ...(showSponsor ? [{ label: 'Sponsor', value: overlay?.sponsorName ?? 'Sponsor Slot' }] : []),
    ...(showLogo ? [{ label: 'Logo', value: config?.logoText ?? 'SURGE' }] : []),
  ];
  const widgetSummaryItems = [
    { label: 'Type', value: widget?.kind ?? 'TIMER' },
    { label: 'Slot', value: widget?.mediaLabel ?? 'Media Slot' },
    { label: 'Sponsor', value: widget?.sponsorName ?? overlay?.sponsorName ?? 'Broadcast Partner' },
    { label: 'CTA', value: widget?.ctaLabel ?? 'Learn More' },
  ];

  function closeDesktopWidget() {
    window.close();
  }

  function reloadDesktopWidget() {
    window.location.reload();
  }

  return (
    <div
      className="overlay-root"
      style={{
        padding: isWidget ? Math.max(2, Math.min(8, Math.round(bounds.width * 0.012))) : 32,
        alignItems: isWidget ? 'stretch' : 'flex-end',
        background: config?.transparentBackground ? 'transparent' : 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.16) 100%)',
        ...dragStyle,
      }}
    >
      <section
        ref={cardRef}
        className="overlay-card"
        style={{
          padding: `${paddingY}px ${paddingX}px`,
          borderRadius: config?.borderRadius ?? 34,
          background: config?.backgroundColor ?? 'rgba(4,11,18,0.90)',
          opacity: config?.panelOpacity ?? 0.92,
          minHeight: isWidget ? '100%' : undefined,
          ...dragStyle,
        }}
      >
        {desktopShell ? (
          <div className="widget-controls" style={{ WebkitAppRegion: 'no-drag' } as CSSProperties & Record<string, string>}>
            <button className="widget-control-button" onClick={reloadDesktopWidget} title="Reload widget">
              Reload
            </button>
            <button className="widget-control-button danger" onClick={closeDesktopWidget} title="Close widget">
              Close
            </button>
          </div>
        ) : null}
        <div
          ref={contentRef}
          style={{
            width: fitScale === 1 ? '100%' : `${100 / fitScale}%`,
            minHeight: fitScale === 1 ? '100%' : `${100 / fitScale}%`,
            transform: fitScale === 1 ? undefined : `scale(${fitScale})`,
            transformOrigin: 'top left',
          }}
        >
          {!widgetIsTimer ? (
            <div className="overlay-grid" style={{ gridTemplateColumns: stackLayout ? '1fr' : '1.15fr 0.85fr', gap }}>
              <div style={{ minWidth: 0 }}>
                <div className="split-row" style={{ marginBottom: Math.max(10, gap - 8), justifyContent: 'flex-start', flexWrap: 'wrap' }}>
                  <span className="status-pill" style={{ background: 'rgba(255,255,255,0.08)', color: widget?.accentColor ?? config?.accentColor ?? textColor }}>
                    {widget?.kind ?? 'CUSTOM'}
                  </span>
                  <span style={{ color: 'rgba(251,253,255,0.72)', overflowWrap: 'anywhere' }}>{widget?.subtitle ?? 'Custom desktop widget'}</span>
                </div>
                <div
                  className="overlay-timer"
                  style={{
                    fontSize: isWidget ? `${Math.max(1.8, 2.8 * computedScale)}rem` : undefined,
                    color: widget?.accentColor ?? config?.accentColor ?? textColor,
                    marginBottom: Math.max(8, gap - 12),
                    lineHeight: 0.96,
                    letterSpacing: '-0.05em',
                    whiteSpace: 'normal',
                  }}
                >
                  {widget?.title ?? 'Widget Display'}
                </div>
                <h1
                  className="headline"
                  style={{
                    color: widget?.textColor ?? textColor,
                    marginBottom: 10,
                    fontSize: isWidget ? `${Math.max(1.1, 1.6 * computedScale)}rem` : undefined,
                    maxWidth: '100%',
                    lineHeight: 1.05,
                    overflowWrap: 'anywhere',
                  }}
                >
                  {widget?.body ?? 'Custom overlay content for branding, advertisements, and operator messaging.'}
                </h1>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: bounds.width < 420 ? '1fr' : `repeat(auto-fit, minmax(${summaryColumnMin}px, 1fr))`,
                  gap: Math.max(8, gap - 12),
                  alignContent: 'start',
                }}
              >
                {widgetSummaryItems.map((item) => (
                  <div
                    key={`${item.label}-${item.value}`}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 16,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.09)',
                    }}
                  >
                    <div style={{ fontSize: `${metaLabelSizeRem}rem`, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(251,253,255,0.58)' }}>
                      {item.label}
                    </div>
                    <div style={{ marginTop: 6, color: widget?.textColor ?? textColor, fontWeight: 600, fontSize: `${metaValueSizeRem}rem`, overflowWrap: 'anywhere' }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
          <div className="overlay-grid" style={{ gridTemplateColumns: stackLayout ? '1fr' : '1.2fr 0.8fr', gap }}>
          <div style={{ textAlign: alignCenter ? 'center' : 'left', minWidth: 0 }}>
            <div className="split-row" style={{ marginBottom: Math.max(10, gap - 8), justifyContent: alignCenter ? 'center' : 'flex-start', flexWrap: 'wrap' }}>
              {config?.showStateBadge !== false ? (
                <span className="status-pill" style={{ background: 'rgba(255,255,255,0.08)', color: config?.accentColor ?? textColor }}>
                  {overlay?.stateLabel ?? 'IDLE'}
                </span>
              ) : null}
              {config?.showClassName !== false ? (
                <span style={{ color: 'rgba(251,253,255,0.72)', overflowWrap: 'anywhere' }}>{overlay?.className ?? 'Awaiting class'}</span>
              ) : null}
            </div>
            <div
              className="overlay-timer"
              style={{
                fontSize: isWidget ? `${timerSizeRem}rem` : undefined,
                color: config?.accentColor ?? textColor,
                marginBottom: Math.max(6, gap - 14),
                whiteSpace: 'nowrap',
              }}
            >
              {timer}
            </div>
            <h1
              className="headline"
              style={{
                color: textColor,
                marginBottom: 10,
                fontSize: isWidget ? `${headlineSizeRem}rem` : undefined,
                maxWidth: alignCenter ? '100%' : 780,
                lineHeight: 1.02,
                overflowWrap: 'anywhere',
              }}
            >
              {overlay?.riderName ?? 'Awaiting rider'}
            </h1>
            {config?.showHorseName !== false ? (
              <p style={{ fontSize: `${sublineSizeRem}rem`, marginTop: 0, marginBottom: 0, color: 'rgba(251,253,255,0.74)', overflowWrap: 'anywhere' }}>
                {overlay?.horseName ?? 'Awaiting horse'}
              </p>
            ) : null}
            {useInlineMeta ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: bounds.width < 360 ? '1fr' : `repeat(auto-fit, minmax(${summaryColumnMin}px, 1fr))`,
                  gap: Math.max(8, gap - 12),
                  marginTop: Math.max(10, gap - 10),
                }}
              >
                {summaryItems.map((item) => (
                  <div
                    key={`${item.label}-${item.value}`}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 14,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.09)',
                    }}
                  >
                    <div style={{ fontSize: `${metaLabelSizeRem}rem`, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(251,253,255,0.58)' }}>
                      {item.label}
                    </div>
                    <div style={{ marginTop: 6, color: textColor, fontWeight: 600, fontSize: `${metaValueSizeRem}rem`, overflowWrap: 'anywhere' }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          {!useInlineMeta ? <div className="overlay-meta" style={{ gap: Math.max(10, gap - 8) }}>
            <div className="overlay-stat">
              <div className="overlay-label">Competitor</div>
              <div className="overlay-value" style={{ color: textColor, fontSize: `${Math.max(1.2, 1.85 * computedScale)}rem` }}>{overlay?.competitorNumber ?? '--'}</div>
            </div>
            {config?.showPenalties !== false ? (
              <div className="overlay-stat">
                <div className="overlay-label">Penalties</div>
                <div className="overlay-value" style={{ color: textColor, fontSize: `${Math.max(1.2, 1.85 * computedScale)}rem` }}>{overlay?.penalties ?? '0'}</div>
              </div>
            ) : null}
            {showSponsor ? (
              <div className="overlay-stat">
                <div className="overlay-label">Presentation</div>
                <div className="overlay-value" style={{ fontSize: `${Math.max(0.95, 1.1 * computedScale)}rem`, color: textColor, overflowWrap: 'anywhere' }}>{overlay?.sponsorName ?? 'Sponsor Slot'}</div>
              </div>
            ) : null}
            {showLogo ? (
              <div className="overlay-stat">
                <div className="overlay-label">Logo / Widget</div>
                <div style={{ marginTop: 8, color: textColor, fontSize: `${metaValueSizeRem}rem`, overflowWrap: 'anywhere' }}>{config?.logoText}</div>
              </div>
            ) : null}
          </div> : null}
          </div>
          )}
        </div>
      </section>
    </div>
  );
}
