'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import type { OverlayCustomization } from '@horse-timer/types';

type OverlayStudioProps = {
  compact?: boolean;
};

const defaultOverlay: OverlayCustomization = {
  themeName: 'Executive Blue',
  transparentBackground: true,
  compactMode: false,
  autoScale: true,
  compactMetaMode: 'AUTO',
  showPenalties: true,
  showSponsor: true,
  showLogo: true,
  showClassName: true,
  showHorseName: true,
  showStateBadge: true,
  fontScale: 1,
  minFontScale: 0.72,
  maxFontScale: 1.12,
  accentColor: '#6bc6ff',
  textColor: '#fbfdff',
  backgroundColor: 'rgba(4,11,18,0.90)',
  panelOpacity: 0.92,
  borderRadius: 34,
  contentGap: 24,
  paddingX: 34,
  paddingY: 34,
  timerAlign: 'LEFT',
  stackBelowWidth: 760,
  collapseMetaBelowWidth: 560,
  hideSponsorBelowWidth: 460,
  hideLogoBelowWidth: 420,
  layout: 'BROADCAST',
  logoText: 'SURGE',
  sponsorText: 'Official Broadcast Partner',
};

export function OverlayStudio({ compact = false }: OverlayStudioProps) {
  const [settings, setSettings] = useState<OverlayCustomization>(defaultOverlay);
  const [savedAt, setSavedAt] = useState<string>('');

  useEffect(() => {
    void apiGet<OverlayCustomization>('/settings/overlay').then(setSettings);
  }, []);

  async function save(next: Partial<OverlayCustomization>) {
    const updated = await apiPost<OverlayCustomization>('/settings/overlay', {
      ...settings,
      ...next,
    });
    setSettings(updated);
    setSavedAt(new Date().toLocaleTimeString());
  }

  function openWidget() {
    const width = compact ? 560 : 780;
    const height = compact ? 220 : 320;
    window.open(
      '/overlay/widget',
      'surge-overlay-widget',
      `popup=yes,width=${width},height=${height},left=100,top=100,resizable=yes`,
    );
  }

  return (
    <div className="metric-card">
      <p className="eyebrow">Overlay Studio</p>
      <p className="panel-title">Desktop widget and broadcast customization</p>
      <div className="section-grid">
        <div className="info-list">
          <div className="info-row">
            <span className="info-label">Theme name</span>
            <input
              value={settings.themeName}
              onChange={(event) => setSettings({ ...settings, themeName: event.target.value })}
              style={inputStyle}
            />
          </div>
          <div className="info-row">
            <span className="info-label">Accent color</span>
            <input
              value={settings.accentColor}
              onChange={(event) => setSettings({ ...settings, accentColor: event.target.value })}
              style={inputStyle}
            />
          </div>
          <div className="info-row">
            <span className="info-label">Background</span>
            <input
              value={settings.backgroundColor}
              onChange={(event) => setSettings({ ...settings, backgroundColor: event.target.value })}
              style={inputStyle}
            />
          </div>
          <div className="info-row">
            <span className="info-label">Font scale</span>
            <input
              type="range"
              min="0.8"
              max="1.4"
              step="0.05"
              value={settings.fontScale}
              onChange={(event) => setSettings({ ...settings, fontScale: Number(event.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
          <div className="info-row">
            <span className="info-label">Auto scale</span>
            <button className="action-button" onClick={() => setSettings({ ...settings, autoScale: !settings.autoScale })}>
              {settings.autoScale ? 'Enabled' : 'Disabled'}
            </button>
          </div>
          <div className="info-row">
            <span className="info-label">Min scale</span>
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.02"
              value={settings.minFontScale}
              onChange={(event) => setSettings({ ...settings, minFontScale: Number(event.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
          <div className="info-row">
            <span className="info-label">Max scale</span>
            <input
              type="range"
              min="1"
              max="1.4"
              step="0.02"
              value={settings.maxFontScale}
              onChange={(event) => setSettings({ ...settings, maxFontScale: Number(event.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
          <div className="info-row">
            <span className="info-label">Panel radius</span>
            <input
              type="range"
              min="12"
              max="40"
              step="1"
              value={settings.borderRadius}
              onChange={(event) => setSettings({ ...settings, borderRadius: Number(event.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
          <div className="info-row">
            <span className="info-label">Horizontal padding</span>
            <input
              type="range"
              min="8"
              max="48"
              step="2"
              value={settings.paddingX}
              onChange={(event) => setSettings({ ...settings, paddingX: Number(event.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
          <div className="info-row">
            <span className="info-label">Vertical padding</span>
            <input
              type="range"
              min="8"
              max="48"
              step="2"
              value={settings.paddingY}
              onChange={(event) => setSettings({ ...settings, paddingY: Number(event.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
        </div>
        <div className="info-list">
          <div className="info-row">
            <span className="info-label">Layout</span>
            <select
              value={settings.layout}
              onChange={(event) => setSettings({ ...settings, layout: event.target.value as OverlayCustomization['layout'] })}
              style={inputStyle}
            >
              <option value="BROADCAST">Broadcast</option>
              <option value="LOWER_THIRD">Lower Third</option>
              <option value="WIDGET">Widget</option>
            </select>
          </div>
          <div className="info-row">
            <span className="info-label">Logo text</span>
            <input
              value={settings.logoText}
              onChange={(event) => setSettings({ ...settings, logoText: event.target.value })}
              style={inputStyle}
            />
          </div>
          <div className="info-row">
            <span className="info-label">Sponsor text</span>
            <input
              value={settings.sponsorText}
              onChange={(event) => setSettings({ ...settings, sponsorText: event.target.value })}
              style={inputStyle}
            />
          </div>
          <div className="info-row">
            <span className="info-label">Text color</span>
            <input
              value={settings.textColor}
              onChange={(event) => setSettings({ ...settings, textColor: event.target.value })}
              style={inputStyle}
            />
          </div>
          <div className="info-row">
            <span className="info-label">Timer align</span>
            <select
              value={settings.timerAlign}
              onChange={(event) => setSettings({ ...settings, timerAlign: event.target.value as OverlayCustomization['timerAlign'] })}
              style={inputStyle}
            >
              <option value="LEFT">Left</option>
              <option value="CENTER">Center</option>
            </select>
          </div>
          <div className="info-row">
            <span className="info-label">Compact meta</span>
            <select
              value={settings.compactMetaMode}
              onChange={(event) => setSettings({ ...settings, compactMetaMode: event.target.value as OverlayCustomization['compactMetaMode'] })}
              style={inputStyle}
            >
              <option value="AUTO">Auto</option>
              <option value="STACK">Stack</option>
              <option value="INLINE">Inline</option>
            </select>
          </div>
          <div className="info-row">
            <span className="info-label">Stack below width</span>
            <input
              type="range"
              min="420"
              max="1100"
              step="10"
              value={settings.stackBelowWidth}
              onChange={(event) => setSettings({ ...settings, stackBelowWidth: Number(event.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
          <div className="info-row">
            <span className="info-label">Collapse meta below</span>
            <input
              type="range"
              min="320"
              max="900"
              step="10"
              value={settings.collapseMetaBelowWidth}
              onChange={(event) => setSettings({ ...settings, collapseMetaBelowWidth: Number(event.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
          <div className="info-row">
            <span className="info-label">Hide sponsor below</span>
            <input
              type="range"
              min="300"
              max="900"
              step="10"
              value={settings.hideSponsorBelowWidth}
              onChange={(event) => setSettings({ ...settings, hideSponsorBelowWidth: Number(event.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
          <div className="info-row">
            <span className="info-label">Hide logo below</span>
            <input
              type="range"
              min="260"
              max="900"
              step="10"
              value={settings.hideLogoBelowWidth}
              onChange={(event) => setSettings({ ...settings, hideLogoBelowWidth: Number(event.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
          <div className="info-row">
            <span className="info-label">Gap</span>
            <input
              type="range"
              min="8"
              max="32"
              step="2"
              value={settings.contentGap}
              onChange={(event) => setSettings({ ...settings, contentGap: Number(event.target.value) })}
              style={{ width: '100%' }}
            />
          </div>
          <div className="info-row">
            <span className="info-label">Transparent</span>
            <button className="action-button" onClick={() => setSettings({ ...settings, transparentBackground: !settings.transparentBackground })}>
              {settings.transparentBackground ? 'Enabled' : 'Disabled'}
            </button>
          </div>
          <div className="info-row">
            <span className="info-label">Compact mode</span>
            <button className="action-button" onClick={() => setSettings({ ...settings, compactMode: !settings.compactMode })}>
              {settings.compactMode ? 'Compact' : 'Expanded'}
            </button>
          </div>
          <div className="info-row">
            <span className="info-label">Show state badge</span>
            <button className="action-button" onClick={() => setSettings({ ...settings, showStateBadge: !settings.showStateBadge })}>
              {settings.showStateBadge ? 'Visible' : 'Hidden'}
            </button>
          </div>
          <div className="info-row">
            <span className="info-label">Show class name</span>
            <button className="action-button" onClick={() => setSettings({ ...settings, showClassName: !settings.showClassName })}>
              {settings.showClassName ? 'Visible' : 'Hidden'}
            </button>
          </div>
          <div className="info-row">
            <span className="info-label">Show horse name</span>
            <button className="action-button" onClick={() => setSettings({ ...settings, showHorseName: !settings.showHorseName })}>
              {settings.showHorseName ? 'Visible' : 'Hidden'}
            </button>
          </div>
          <div className="info-row">
            <span className="info-label">Show penalties</span>
            <button className="action-button" onClick={() => setSettings({ ...settings, showPenalties: !settings.showPenalties })}>
              {settings.showPenalties ? 'Visible' : 'Hidden'}
            </button>
          </div>
          <div className="info-row">
            <span className="info-label">Show sponsor</span>
            <button className="action-button" onClick={() => setSettings({ ...settings, showSponsor: !settings.showSponsor })}>
              {settings.showSponsor ? 'Visible' : 'Hidden'}
            </button>
          </div>
          <div className="info-row">
            <span className="info-label">Show logo</span>
            <button className="action-button" onClick={() => setSettings({ ...settings, showLogo: !settings.showLogo })}>
              {settings.showLogo ? 'Visible' : 'Hidden'}
            </button>
          </div>
        </div>
      </div>
      <div className="split-row" style={{ marginTop: 18, flexWrap: 'wrap' }}>
        <div className="muted">
          Last saved {savedAt || 'not yet in this session'}
          {' · '}
          Native widget launcher available through `npm run widget`
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="action-button" onClick={openWidget}>
            Open Browser Widget
          </button>
          <button className="action-button accent" onClick={() => void save(settings)}>
            Save Overlay
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 14,
  border: '1px solid rgba(15,23,42,0.08)',
  background: '#ffffff',
  color: '#0f172a',
};
