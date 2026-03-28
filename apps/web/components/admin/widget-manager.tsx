'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { apiDelete, apiGet, apiPatch, apiPost } from '../../lib/api';
import { DEFAULT_PUBLIC_WEB_BASE_URL } from '../../lib/runtime-config';
import type { WidgetDefinition, WidgetKind, WidgetStatus } from '@horse-timer/types';

const blankWidget: Partial<WidgetDefinition> = {
  name: '',
  kind: 'CUSTOM_MESSAGE',
  status: 'DRAFT',
  width: 760,
  height: 260,
  title: '',
  subtitle: '',
  body: '',
  accentColor: '#6bc6ff',
  backgroundColor: 'rgba(4,11,18,0.90)',
  textColor: '#fbfdff',
  sponsorName: 'Broadcast Partner',
  mediaLabel: 'Media Slot',
  ctaLabel: 'Learn More',
  transparentBackground: true,
};

type WidgetManagerProps = {
  focus?: 'ALL' | 'BRANDING';
};

const LOCAL_WIDGET_LAUNCHER_URL = 'http://127.0.0.1:43123';

function buildPreviewWidget(draft: Partial<WidgetDefinition>, editingId: string | null): WidgetDefinition {
  const id = editingId ?? 'preview-widget';
  return {
    id,
    name: draft.name ?? 'Preview Widget',
    kind: draft.kind ?? 'CUSTOM_MESSAGE',
    status: draft.status ?? 'DRAFT',
    route: draft.route ?? `/overlay/widget?widget=${id}`,
    width: draft.width ?? 760,
    height: draft.height ?? 260,
    title: draft.title ?? 'Preview Headline',
    subtitle: draft.subtitle ?? 'Preview subtitle',
    body: draft.body ?? 'Your widget content preview updates live while you design it.',
    accentColor: draft.accentColor ?? '#6bc6ff',
    backgroundColor: draft.backgroundColor ?? 'rgba(4,11,18,0.90)',
    textColor: draft.textColor ?? '#fbfdff',
    sponsorName: draft.sponsorName ?? 'Broadcast Partner',
    mediaLabel: draft.mediaLabel ?? 'Media Slot',
    ctaLabel: draft.ctaLabel ?? 'Learn More',
    removable: draft.removable ?? true,
    transparentBackground: draft.transparentBackground ?? true,
  };
}

export function WidgetManager({ focus = 'ALL' }: WidgetManagerProps) {
  const [widgets, setWidgets] = useState<WidgetDefinition[]>([]);
  const [draft, setDraft] = useState<Partial<WidgetDefinition>>(blankWidget);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [previewRevision, setPreviewRevision] = useState(0);
  const [launcherState, setLauncherState] = useState<'idle' | 'launching' | 'closing'>('idle');
  const [launcherMessage, setLauncherMessage] = useState<string | null>(null);
  const [launcherReachability, setLauncherReachability] = useState<'unknown' | 'online' | 'offline'>('unknown');

  async function load() {
    const data = await apiGet<WidgetDefinition[]>('/settings/widgets');
    setWidgets(data);
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let cancelled = false;

    async function probeLauncher() {
      try {
        const response = await fetch(`${LOCAL_WIDGET_LAUNCHER_URL}/health`, {
          method: 'GET',
          cache: 'no-store',
        });
        if (!cancelled) {
          setLauncherReachability(response.ok ? 'online' : 'offline');
        }
      } catch {
        if (!cancelled) {
          setLauncherReachability('offline');
        }
      }
    }

    void probeLauncher();
    const interval = window.setInterval(() => {
      void probeLauncher();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!editingId) {
      return;
    }

    const timeout = window.setTimeout(async () => {
      setAutoSaveState('saving');
      await apiPatch(`/settings/widgets/${editingId}`, draft);
      setPreviewRevision((current) => current + 1);
      setAutoSaveState('saved');
      await load();
      window.setTimeout(() => setAutoSaveState('idle'), 1200);
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [draft, editingId]);

  const visibleWidgets = useMemo(() => {
    if (focus === 'BRANDING') {
      return widgets.filter((item) => item.kind === 'ADVERTISEMENT' || item.kind === 'SPONSOR');
    }
    return widgets;
  }, [focus, widgets]);
  const previewWidget = useMemo(() => buildPreviewWidget(draft, editingId), [draft, editingId]);
  const hostedWidgetBase =
    typeof window !== 'undefined'
      ? window.location.origin.replace(/\/$/, '')
      : DEFAULT_PUBLIC_WEB_BASE_URL;

  function buildWidgetUrl(widgetRoute?: string) {
    const fallbackRoute = '/overlay/widget';
    const route = widgetRoute ?? fallbackRoute;
    return route.startsWith('http')
      ? route
      : `${hostedWidgetBase}${route.startsWith('/') ? route : `/${route}`}`;
  }

  function openWidgetWindow(widgetRoute?: string, dimensions?: { width?: number; height?: number }) {
    const targetUrl = buildWidgetUrl(widgetRoute);
    const width = Math.max(520, dimensions?.width ?? 900);
    const height = Math.max(260, dimensions?.height ?? 420);
    window.open(targetUrl, '_blank', `popup=yes,resizable=yes,width=${width},height=${height}`);
  }

  function buildDesktopProtocolUrl(widgetRoute?: string, dimensions?: { width?: number; height?: number }) {
    const launchUrl = new URL('surgetimer-widget://launch');
    launchUrl.searchParams.set('url', buildWidgetUrl(widgetRoute));
    launchUrl.searchParams.set('width', String(Math.max(520, dimensions?.width ?? 900)));
    launchUrl.searchParams.set('height', String(Math.max(260, dimensions?.height ?? 420)));
    return launchUrl.toString();
  }

  function requestDesktopLaunch(widgetRoute?: string, dimensions?: { width?: number; height?: number }) {
    const launchUrl = buildDesktopProtocolUrl(widgetRoute, dimensions);
    window.location.href = launchUrl;
  }

  async function requestLocalLauncher(widgetRoute?: string, dimensions?: { width?: number; height?: number }) {
    const response = await fetch(`${LOCAL_WIDGET_LAUNCHER_URL}/launch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: buildWidgetUrl(widgetRoute),
        width: Math.max(520, dimensions?.width ?? 900),
        height: Math.max(260, dimensions?.height ?? 420),
      }),
    });

    if (!response.ok) {
      throw new Error('Local widget launcher is not reachable.');
    }

    setLauncherReachability('online');
    return response.json();
  }

  function isHostedEnvironment() {
    if (typeof window === 'undefined') {
      return false;
    }
    const host = window.location.hostname;
    return !(host === 'localhost' || host === '127.0.0.1');
  }

  async function saveWidget() {
    if (editingId) {
      await apiPatch(`/settings/widgets/${editingId}`, draft);
    } else {
      await apiPost('/settings/widgets', draft);
    }
    setPreviewRevision((current) => current + 1);
    setDraft(blankWidget);
    setEditingId(null);
    await load();
  }

  async function removeWidget(id: string) {
    await apiDelete(`/settings/widgets/${id}`);
    if (editingId === id) {
      setEditingId(null);
      setDraft(blankWidget);
    }
    await load();
  }

  async function launchWidget(id: string) {
    setLauncherState('launching');
    try {
      const widget = widgets.find((item) => item.id === id);
      if (isHostedEnvironment()) {
        try {
          await requestLocalLauncher(widget?.route, { width: widget?.width, height: widget?.height });
          setLauncherMessage('Native widget launched through the local SurgeTimer Widget bridge.');
        } catch {
          requestDesktopLaunch(widget?.route, { width: widget?.width, height: widget?.height });
          setLauncherMessage('Local launcher was offline, so a desktop launch request was sent through the system protocol. Open the SurgeTimer Widget app once if nothing appears.');
        }
        return;
      }

      const result = await apiPost<{ launched: boolean; reason?: string; url?: string }>(`/settings/widgets/${id}/launch`);
      if (result.launched) {
        setLauncherMessage('Native desktop widget launched successfully.');
      } else {
        openWidgetWindow(widget?.route, { width: widget?.width, height: widget?.height });
        setLauncherMessage(result.reason ?? 'Native launch unavailable. Opened widget in a browser window instead.');
      }
    } finally {
      setLauncherState('idle');
    }
  }

  async function launchDefaultWidget() {
    setLauncherState('launching');
    try {
      if (isHostedEnvironment()) {
        try {
          await requestLocalLauncher('/overlay/widget?desktop=1');
          setLauncherMessage('Native widget launched through the local SurgeTimer Widget bridge.');
        } catch {
          requestDesktopLaunch('/overlay/widget?desktop=1');
          setLauncherMessage('Local launcher was offline, so a desktop launch request was sent through the system protocol. Open the SurgeTimer Widget app once if nothing appears.');
        }
        return;
      }

      const result = await apiPost<{ launched: boolean; reason?: string; url?: string }>('/settings/widgets/launch-default');
      if (result.launched) {
        setLauncherMessage('Native desktop widget launched successfully.');
      } else {
        openWidgetWindow('/overlay/widget?desktop=1');
        setLauncherMessage(result.reason ?? 'Native launch unavailable. Opened widget in a browser window instead.');
      }
    } finally {
      setLauncherState('idle');
    }
  }

  async function closeAllWidgets() {
    setLauncherState('closing');
    try {
      await apiPost('/settings/widgets/close-all');
      setLauncherMessage('All tracked native widgets were closed.');
    } finally {
      setLauncherState('idle');
    }
  }

  function editWidget(widget: WidgetDefinition) {
    setEditingId(widget.id);
    setDraft(widget);
  }

  function updateField<K extends keyof WidgetDefinition | keyof Partial<WidgetDefinition>>(key: K, value: unknown) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <div className="section-stack">
      <div className="metric-card">
        <p className="eyebrow">{focus === 'BRANDING' ? 'Branding Widgets' : 'Widget Registry'}</p>
        <p className="panel-title">
          {focus === 'BRANDING'
            ? 'Manage sponsor rails, ad placements, and promotional widgets'
            : 'Create, update, launch, and remove desktop-ready widgets'}
        </p>
        <div className="admin-toolbar">
          <div className="tip-card">
            <p className="tip-title">Timer widgets</p>
            <p className="tip-copy">Use these for live timing, lower thirds, scoreboard panels, or compact desktop clocks.</p>
          </div>
          <div className="tip-card">
            <p className="tip-title">Brand widgets</p>
            <p className="tip-copy">Run sponsor cards, partner promotions, arena announcements, and event marketing overlays separately.</p>
          </div>
          <div className="tip-card">
            <p className="tip-title">Desktop launch</p>
            <p className="tip-copy">Use browser open for web capture, or install and run the local SurgeTimer Widget app once so this page can trigger native desktop launch.</p>
          </div>
        </div>
        <div className="button-grid" style={{ marginTop: 18 }}>
          <button className="action-button accent" onClick={() => void launchDefaultWidget()} disabled={launcherState !== 'idle'}>
            {launcherState === 'launching' ? 'Launching...' : 'Run Native Widget'}
          </button>
          <button className="action-button" onClick={() => void closeAllWidgets()} disabled={launcherState !== 'idle'}>
            {launcherState === 'closing' ? 'Closing...' : 'Close Native Widgets'}
          </button>
        </div>
        {launcherMessage ? (
          <div className="status-pill" style={{ marginTop: 14 }}>
            {launcherMessage}
          </div>
        ) : null}
        <div className="info-row" style={{ marginTop: 14 }}>
          <span className="info-label">Local widget bridge</span>
          <span className="info-value">{launcherReachability === 'online' ? 'Online' : launcherReachability === 'offline' ? 'Offline' : 'Checking'}</span>
        </div>
      </div>

      <div className="section-grid admin-two-panel">
        <div className="metric-card">
          <p className="eyebrow">Saved Widgets</p>
          <p className="panel-title">Widget catalog</p>
          <div className="widget-grid">
            {visibleWidgets.map((widget) => (
              <div key={widget.id} className="widget-card">
                <div className="split-row" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <p className="widget-card-title">{widget.name}</p>
                    <p className="widget-card-subtitle">{widget.kind} · {widget.status}</p>
                  </div>
                  <span className="status-pill">{widget.width} x {widget.height}</span>
                </div>
                <p className="widget-card-copy">{widget.body}</p>
                <div className="info-list">
                  <div className="info-row">
                    <span className="info-label">Route</span>
                    <span className="info-value">{widget.route}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Title</span>
                    <span className="info-value">{widget.title}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Sponsor</span>
                    <span className="info-value">{widget.sponsorName}</span>
                  </div>
                </div>
                <div className="button-grid" style={{ marginTop: 16 }}>
                  <button className="action-button" onClick={() => editWidget(widget)}>
                    Edit
                  </button>
                  <button className="action-button accent" onClick={() => void launchWidget(widget.id)}>
                    Launch Widget
                  </button>
                  <button className="action-button" onClick={() => openWidgetWindow(widget.route, { width: widget.width, height: widget.height })}>
                    Open
                  </button>
                  {widget.removable ? (
                    <button className="action-button danger" onClick={() => void removeWidget(widget.id)}>
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="metric-card">
          <p className="eyebrow">{editingId ? 'Edit Widget' : 'Create Widget'}</p>
          <p className="panel-title">Widget configuration</p>
          {editingId ? (
            <div className="status-pill" style={{ marginBottom: 16 }}>
              Auto-save: {autoSaveState === 'saving' ? 'Saving...' : autoSaveState === 'saved' ? 'Saved' : 'Ready'}
            </div>
          ) : null}
          <div className="form-grid">
            <label className="field-stack">
              <span className="info-label">Name</span>
              <input value={draft.name ?? ''} onChange={(event) => updateField('name', event.target.value)} style={inputStyle} />
            </label>
            <label className="field-stack">
              <span className="info-label">Type</span>
              <select value={draft.kind ?? 'CUSTOM_MESSAGE'} onChange={(event) => updateField('kind', event.target.value as WidgetKind)} style={inputStyle}>
                <option value="TIMER">Timer</option>
                <option value="ADVERTISEMENT">Advertisement</option>
                <option value="SPONSOR">Sponsor</option>
                <option value="CUSTOM_MESSAGE">Custom Message</option>
              </select>
            </label>
            <label className="field-stack">
              <span className="info-label">Status</span>
              <select value={draft.status ?? 'DRAFT'} onChange={(event) => updateField('status', event.target.value as WidgetStatus)} style={inputStyle}>
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
                <option value="DISABLED">Disabled</option>
              </select>
            </label>
            <label className="field-stack">
              <span className="info-label">Width</span>
              <input value={draft.width ?? 760} type="number" onChange={(event) => updateField('width', Number(event.target.value))} style={inputStyle} />
            </label>
            <label className="field-stack">
              <span className="info-label">Height</span>
              <input value={draft.height ?? 260} type="number" onChange={(event) => updateField('height', Number(event.target.value))} style={inputStyle} />
            </label>
            <label className="field-stack">
              <span className="info-label">Accent</span>
              <input value={draft.accentColor ?? '#6bc6ff'} onChange={(event) => updateField('accentColor', event.target.value)} style={inputStyle} />
            </label>
            <label className="field-stack span-2">
              <span className="info-label">Headline</span>
              <input value={draft.title ?? ''} onChange={(event) => updateField('title', event.target.value)} style={inputStyle} />
            </label>
            <label className="field-stack span-2">
              <span className="info-label">Subline</span>
              <input value={draft.subtitle ?? ''} onChange={(event) => updateField('subtitle', event.target.value)} style={inputStyle} />
            </label>
            <label className="field-stack span-2">
              <span className="info-label">Body</span>
              <textarea value={draft.body ?? ''} onChange={(event) => updateField('body', event.target.value)} style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }} />
            </label>
            <label className="field-stack">
              <span className="info-label">Sponsor</span>
              <input value={draft.sponsorName ?? ''} onChange={(event) => updateField('sponsorName', event.target.value)} style={inputStyle} />
            </label>
            <label className="field-stack">
              <span className="info-label">Media Label</span>
              <input value={draft.mediaLabel ?? ''} onChange={(event) => updateField('mediaLabel', event.target.value)} style={inputStyle} />
            </label>
            <label className="field-stack">
              <span className="info-label">CTA</span>
              <input value={draft.ctaLabel ?? ''} onChange={(event) => updateField('ctaLabel', event.target.value)} style={inputStyle} />
            </label>
            <label className="field-stack">
              <span className="info-label">Background</span>
              <input value={draft.backgroundColor ?? ''} onChange={(event) => updateField('backgroundColor', event.target.value)} style={inputStyle} />
            </label>
            <label className="field-stack">
              <span className="info-label">Text Color</span>
              <input value={draft.textColor ?? ''} onChange={(event) => updateField('textColor', event.target.value)} style={inputStyle} />
            </label>
          </div>
          <div className="button-grid" style={{ marginTop: 18 }}>
            <button className="action-button accent" onClick={() => void saveWidget()}>
              {editingId ? 'Save Widget' : 'Create Widget'}
            </button>
            {editingId ? (
              <button className="action-button" onClick={() => void launchWidget(editingId)}>
                Launch This Widget
              </button>
            ) : null}
            <button className="action-button" onClick={() => { setDraft(blankWidget); setEditingId(null); }}>
              Clear
            </button>
          </div>
          <div className="widget-preview-shell" style={{ marginTop: 22 }}>
            <div className="split-row" style={{ marginBottom: 12 }}>
              <p className="eyebrow" style={{ marginBottom: 0 }}>Live Preview</p>
              <span className="status-pill">{previewWidget.width} x {previewWidget.height}</span>
            </div>
            {editingId ? (
              <iframe
                src={`/overlay/widget?widget=${editingId}&previewRev=${previewRevision}`}
                title="Widget live preview"
                className="widget-preview-frame"
                style={{
                  width: '100%',
                  height: Math.max(240, Math.min(420, previewWidget.height + 60)),
                  border: 0,
                  borderRadius: 24,
                  background: '#08111b',
                }}
              />
            ) : null}
            <div
              className="widget-preview-card"
              style={{
                background: previewWidget.backgroundColor,
                color: previewWidget.textColor,
                borderColor: `${previewWidget.accentColor}55`,
                minHeight: Math.max(190, Math.min(360, previewWidget.height)),
                marginTop: editingId ? 14 : 0,
              }}
            >
              <div className="split-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div>
                  <p className="widget-preview-type" style={{ color: previewWidget.accentColor }}>
                    {previewWidget.kind}
                  </p>
                  <h3 className="widget-preview-title" style={{ color: previewWidget.textColor }}>
                    {previewWidget.title}
                  </h3>
                  <p className="widget-preview-subtitle">{previewWidget.subtitle}</p>
                </div>
                <span className="widget-preview-chip">{previewWidget.mediaLabel}</span>
              </div>
              <p className="widget-preview-body">{previewWidget.body}</p>
              <div className="widget-preview-meta">
                <div className="widget-preview-box">
                  <span className="info-label">Sponsor</span>
                  <strong>{previewWidget.sponsorName}</strong>
                </div>
                <div className="widget-preview-box">
                  <span className="info-label">CTA</span>
                  <strong>{previewWidget.ctaLabel}</strong>
                </div>
                <div className="widget-preview-box">
                  <span className="info-label">Status</span>
                  <strong>{previewWidget.status}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 16,
  border: '1px solid rgba(15, 23, 42, 0.09)',
  background: '#ffffff',
  color: '#142033',
} satisfies CSSProperties;
