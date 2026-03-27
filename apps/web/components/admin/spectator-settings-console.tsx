'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { apiGet, apiPost } from '../../lib/api';
import { DEFAULT_PUBLIC_WEB_BASE_URL } from '../../lib/runtime-config';
import type { PublicLiveFeed, SpectatorSettings } from '@horse-timer/types';

const defaultSettings: SpectatorSettings = {
  enabled: true,
  publicBaseUrl: DEFAULT_PUBLIC_WEB_BASE_URL,
  requireToken: false,
  shareToken: 'surge-live-2026',
  title: 'Live Arena Scoreboard',
  subtitle: 'Scan to follow the live round timer, current competitor, and completed results.',
  accentColor: '#6bc6ff',
  backgroundColor: '#08111b',
  textColor: '#f8fafc',
  cardOpacity: 0.78,
  historyLimit: 24,
  autoRefreshMs: 900,
  useRealtimeSocket: true,
  showEventName: true,
  showClassName: true,
  showHorseName: true,
  showPenalties: true,
  showSponsor: true,
  showActiveTimeline: true,
  showRunHistory: true,
  showUpdatedAt: true,
  showQueuePreview: true,
  queuePreviewSize: 3,
  showScanHelp: true,
};

export function SpectatorSettingsConsole() {
  const [settings, setSettings] = useState<SpectatorSettings>(defaultSettings);
  const [savedAt, setSavedAt] = useState('');
  const [previewRev, setPreviewRev] = useState(0);

  useEffect(() => {
    void apiGet<SpectatorSettings>('/settings/spectator').then(setSettings);
  }, []);

  const previewUrl = useMemo(() => {
    const base = settings.publicBaseUrl || DEFAULT_PUBLIC_WEB_BASE_URL;
    const query = settings.requireToken ? `?token=${encodeURIComponent(settings.shareToken)}` : '';
    return `${base}/live/event-demo/class-demo${query}`;
  }, [settings.publicBaseUrl, settings.requireToken, settings.shareToken]);

  async function save() {
    const updated = await apiPost<SpectatorSettings>('/settings/spectator', settings);
    setSettings(updated);
    setSavedAt(new Date().toLocaleTimeString());
    setPreviewRev((current) => current + 1);
  }

  return (
    <div className="metric-card">
      <p className="eyebrow">Spectator Studio</p>
      <p className="panel-title">Premium live scoreboard design, sharing rules, and public device behavior</p>
      <div className="section-grid admin-two-panel">
        <div className="form-grid">
          <label className="field-stack span-2">
            <span className="info-label">Scoreboard title</span>
            <input value={settings.title} onChange={(event) => setSettings({ ...settings, title: event.target.value })} style={inputStyle} />
          </label>
          <label className="field-stack span-2">
            <span className="info-label">Subtitle</span>
            <input value={settings.subtitle} onChange={(event) => setSettings({ ...settings, subtitle: event.target.value })} style={inputStyle} />
          </label>
          <label className="field-stack span-2">
            <span className="info-label">Public base URL</span>
            <input value={settings.publicBaseUrl} onChange={(event) => setSettings({ ...settings, publicBaseUrl: event.target.value })} style={inputStyle} />
          </label>
          <label className="field-stack">
            <span className="info-label">Accent color</span>
            <input value={settings.accentColor} onChange={(event) => setSettings({ ...settings, accentColor: event.target.value })} style={inputStyle} />
          </label>
          <label className="field-stack">
            <span className="info-label">Background</span>
            <input value={settings.backgroundColor} onChange={(event) => setSettings({ ...settings, backgroundColor: event.target.value })} style={inputStyle} />
          </label>
          <label className="field-stack">
            <span className="info-label">Text color</span>
            <input value={settings.textColor} onChange={(event) => setSettings({ ...settings, textColor: event.target.value })} style={inputStyle} />
          </label>
          <label className="field-stack">
            <span className="info-label">Card opacity</span>
            <input type="range" min="0.4" max="0.95" step="0.01" value={settings.cardOpacity} onChange={(event) => setSettings({ ...settings, cardOpacity: Number(event.target.value) })} />
          </label>
          <label className="field-stack">
            <span className="info-label">History limit</span>
            <input type="number" value={settings.historyLimit} onChange={(event) => setSettings({ ...settings, historyLimit: Number(event.target.value) })} style={inputStyle} />
          </label>
          <label className="field-stack">
            <span className="info-label">Refresh fallback ms</span>
            <input type="number" value={settings.autoRefreshMs} onChange={(event) => setSettings({ ...settings, autoRefreshMs: Number(event.target.value) })} style={inputStyle} />
          </label>
          <label className="field-stack">
            <span className="info-label">Queue preview size</span>
            <input type="number" value={settings.queuePreviewSize} onChange={(event) => setSettings({ ...settings, queuePreviewSize: Number(event.target.value) })} style={inputStyle} />
          </label>
          <label className="field-stack span-2">
            <span className="info-label">Access token</span>
            <input value={settings.shareToken} onChange={(event) => setSettings({ ...settings, shareToken: event.target.value })} style={inputStyle} />
          </label>
          <Toggle label="Spectator view enabled" value={settings.enabled} onToggle={() => setSettings({ ...settings, enabled: !settings.enabled })} />
          <Toggle label="Require token" value={settings.requireToken} onToggle={() => setSettings({ ...settings, requireToken: !settings.requireToken })} />
          <Toggle label="Realtime socket updates" value={settings.useRealtimeSocket} onToggle={() => setSettings({ ...settings, useRealtimeSocket: !settings.useRealtimeSocket })} />
          <Toggle label="Show event name" value={settings.showEventName} onToggle={() => setSettings({ ...settings, showEventName: !settings.showEventName })} />
          <Toggle label="Show class name" value={settings.showClassName} onToggle={() => setSettings({ ...settings, showClassName: !settings.showClassName })} />
          <Toggle label="Show horse name" value={settings.showHorseName} onToggle={() => setSettings({ ...settings, showHorseName: !settings.showHorseName })} />
          <Toggle label="Show penalties" value={settings.showPenalties} onToggle={() => setSettings({ ...settings, showPenalties: !settings.showPenalties })} />
          <Toggle label="Show sponsor" value={settings.showSponsor} onToggle={() => setSettings({ ...settings, showSponsor: !settings.showSponsor })} />
          <Toggle label="Show active timeline" value={settings.showActiveTimeline} onToggle={() => setSettings({ ...settings, showActiveTimeline: !settings.showActiveTimeline })} />
          <Toggle label="Show run history" value={settings.showRunHistory} onToggle={() => setSettings({ ...settings, showRunHistory: !settings.showRunHistory })} />
          <Toggle label="Show queue preview" value={settings.showQueuePreview} onToggle={() => setSettings({ ...settings, showQueuePreview: !settings.showQueuePreview })} />
          <Toggle label="Show updated time" value={settings.showUpdatedAt} onToggle={() => setSettings({ ...settings, showUpdatedAt: !settings.showUpdatedAt })} />
          <Toggle label="Show scan help" value={settings.showScanHelp} onToggle={() => setSettings({ ...settings, showScanHelp: !settings.showScanHelp })} />
        </div>
        <div className="section-stack">
          <div className="spectator-preview-panel">
            <div className="split-row" style={{ marginBottom: 12 }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: 4 }}>Live Preview</p>
                <p className="muted" style={{ margin: 0 }}>This reflects the saved spectator scoreboard design.</p>
              </div>
              <span className="status-pill">Premium Scoreboard</span>
            </div>
            <iframe
              src={`${previewUrl}&previewRev=${previewRev}`}
              title="Spectator preview"
              className="widget-preview-frame"
              style={{ width: '100%', height: 640, border: 0, borderRadius: 24, background: '#08111b' }}
            />
          </div>
          <div className="tip-card">
            <p className="tip-title">Public spectator link</p>
            <p className="tip-copy">{previewUrl}</p>
          </div>
        </div>
      </div>
      <div className="split-row" style={{ marginTop: 18, flexWrap: 'wrap' }}>
        <div className="muted">Last saved {savedAt || 'not yet in this session'}</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a className="action-button" href={previewUrl} target="_blank" rel="noreferrer">
            Open Spectator Page
          </a>
          <button className="action-button accent" onClick={() => void save()}>
            Save Spectator Settings
          </button>
        </div>
      </div>
    </div>
  );
}

function Toggle({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <button className="action-button" onClick={onToggle}>
        {value ? 'Enabled' : 'Disabled'}
      </button>
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
