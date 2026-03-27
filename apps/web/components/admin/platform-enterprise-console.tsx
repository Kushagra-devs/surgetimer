'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { AppSettings, ArenaProfile, DiagnosticsBundle } from '@horse-timer/types';
import { apiGet, apiPost } from '../../lib/api';

const fallbackArena: ArenaProfile = {
  id: '',
  name: '',
  locationLabel: '',
  status: 'STANDBY',
  surfaceType: '',
  supportsBroadcast: false,
  notes: '',
};

export function PlatformEnterpriseConsole() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [draftArena, setDraftArena] = useState<ArenaProfile>(fallbackArena);
  const [bundle, setBundle] = useState<DiagnosticsBundle | null>(null);
  const [savedAt, setSavedAt] = useState('');

  async function load() {
    const [appSettings, diagnostics] = await Promise.all([
      apiGet<AppSettings>('/settings/app'),
      apiGet<DiagnosticsBundle>('/reports/diagnostics-bundle'),
    ]);
    setSettings(appSettings);
    setBundle(diagnostics);
  }

  useEffect(() => {
    void load();
  }, []);

  const activeArena = useMemo(
    () => settings?.arenas.find((arena) => arena.id === settings.activeArenaId) ?? settings?.arenas[0] ?? null,
    [settings],
  );

  async function save() {
    if (!settings) {
      return;
    }
    const updated = await apiPost<AppSettings>('/settings/app', settings);
    setSettings(updated);
    setSavedAt(new Date().toLocaleTimeString());
    setBundle(await apiGet<DiagnosticsBundle>('/reports/diagnostics-bundle'));
  }

  function addArena() {
    if (!settings || !draftArena.id || !draftArena.name) {
      return;
    }
    setSettings({
      ...settings,
      arenas: [...settings.arenas, draftArena],
      activeArenaId: settings.activeArenaId || draftArena.id,
    });
    setDraftArena(fallbackArena);
  }

  function removeArena(id: string) {
    if (!settings || settings.arenas.length <= 1) {
      return;
    }
    const arenas = settings.arenas.filter((arena) => arena.id !== id);
    setSettings({
      ...settings,
      arenas,
      activeArenaId: settings.activeArenaId === id ? arenas[0]?.id ?? '' : settings.activeArenaId,
    });
  }

  if (!settings) {
    return <div className="metric-card">Loading platform controls...</div>;
  }

  return (
    <div className="section-stack">
      <div className="metric-card">
        <p className="eyebrow">Platform Control</p>
        <p className="panel-title">Venue identity, arena topology, deployment profile, licensing, and support readiness</p>
        <div className="split-row" style={{ flexWrap: 'wrap', marginTop: 18 }}>
          <div className="super-admin-chip-row">
            <span className="super-admin-chip">{settings.deployment.mode === 'LOCAL_LAN' ? 'Offline-first LAN' : 'Hybrid venue'}</span>
            <span className="super-admin-chip">{settings.license.supportTier.replace('_', ' ')}</span>
            <span className="super-admin-chip">{settings.arenas.length} arena profile(s)</span>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="action-button" onClick={() => void load()}>
              Refresh Diagnostics
            </button>
            <button className="action-button accent" onClick={() => void save()}>
              Save Platform Profile
            </button>
          </div>
        </div>
      </div>

      <div className="section-grid admin-two-panel">
        <div className="metric-card">
          <p className="eyebrow">White-Label Branding</p>
          <p className="panel-title">Identity and venue-facing presentation</p>
          <div className="form-grid">
            <label className="field-stack">
              <span className="info-label">Organization</span>
              <input value={settings.branding.organizationName} onChange={(event) => setSettings({ ...settings, branding: { ...settings.branding, organizationName: event.target.value } })} style={inputStyle} />
            </label>
            <label className="field-stack">
              <span className="info-label">Product label</span>
              <input value={settings.branding.productLabel} onChange={(event) => setSettings({ ...settings, branding: { ...settings.branding, productLabel: event.target.value } })} style={inputStyle} />
            </label>
            <label className="field-stack">
              <span className="info-label">Short label</span>
              <input value={settings.branding.shortLabel} onChange={(event) => setSettings({ ...settings, branding: { ...settings.branding, shortLabel: event.target.value } })} style={inputStyle} />
            </label>
            <label className="field-stack">
              <span className="info-label">Logo text</span>
              <input value={settings.branding.logoText} onChange={(event) => setSettings({ ...settings, branding: { ...settings.branding, logoText: event.target.value } })} style={inputStyle} />
            </label>
            <label className="field-stack">
              <span className="info-label">Primary color</span>
              <input value={settings.branding.primaryColor} onChange={(event) => setSettings({ ...settings, branding: { ...settings.branding, primaryColor: event.target.value } })} style={inputStyle} />
            </label>
            <label className="field-stack">
              <span className="info-label">Secondary color</span>
              <input value={settings.branding.secondaryColor} onChange={(event) => setSettings({ ...settings, branding: { ...settings.branding, secondaryColor: event.target.value } })} style={inputStyle} />
            </label>
          </div>
        </div>

        <div className="metric-card">
          <p className="eyebrow">Deployment Profile</p>
          <p className="panel-title">Offline-first appliance posture and local venue routing</p>
          <div className="form-grid">
            <label className="field-stack">
              <span className="info-label">Deployment mode</span>
              <select value={settings.deployment.mode} onChange={(event) => setSettings({ ...settings, deployment: { ...settings.deployment, mode: event.target.value as AppSettings['deployment']['mode'] } })} style={inputStyle}>
                <option value="LOCAL_LAN">Local LAN</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </label>
            <label className="field-stack">
              <span className="info-label">Site label</span>
              <input value={settings.deployment.siteLabel} onChange={(event) => setSettings({ ...settings, deployment: { ...settings.deployment, siteLabel: event.target.value } })} style={inputStyle} />
            </label>
            <label className="field-stack">
              <span className="info-label">Appliance name</span>
              <input value={settings.deployment.applianceName} onChange={(event) => setSettings({ ...settings, deployment: { ...settings.deployment, applianceName: event.target.value } })} style={inputStyle} />
            </label>
            <label className="field-stack">
              <span className="info-label">Local hostname</span>
              <input value={settings.deployment.localHostname} onChange={(event) => setSettings({ ...settings, deployment: { ...settings.deployment, localHostname: event.target.value } })} style={inputStyle} />
            </label>
            <label className="field-stack span-2">
              <span className="info-label">Local base URL</span>
              <input value={settings.deployment.localBaseUrl} onChange={(event) => setSettings({ ...settings, deployment: { ...settings.deployment, localBaseUrl: event.target.value } })} style={inputStyle} />
            </label>
            <ToggleRow label="Enforce LAN-only operation" value={settings.deployment.enforceLanOnly} onToggle={() => setSettings({ ...settings, deployment: { ...settings.deployment, enforceLanOnly: !settings.deployment.enforceLanOnly } })} />
            <ToggleRow label="Cache critical routes" value={settings.deployment.cacheCriticalRoutes} onToggle={() => setSettings({ ...settings, deployment: { ...settings.deployment, cacheCriticalRoutes: !settings.deployment.cacheCriticalRoutes } })} />
            <ToggleRow label="Auto-reconnect hardware" value={settings.deployment.autoReconnectHardware} onToggle={() => setSettings({ ...settings, deployment: { ...settings.deployment, autoReconnectHardware: !settings.deployment.autoReconnectHardware } })} />
          </div>
        </div>
      </div>

      <div className="section-grid admin-two-panel">
        <div className="metric-card">
          <p className="eyebrow">Arena Topology</p>
          <p className="panel-title">Multi-event and multi-arena venue structure</p>
          <div className="info-list">
            <label className="field-stack">
              <span className="info-label">Active arena</span>
              <select value={settings.activeArenaId} onChange={(event) => setSettings({ ...settings, activeArenaId: event.target.value })} style={inputStyle}>
                {settings.arenas.map((arena) => (
                  <option key={arena.id} value={arena.id}>
                    {arena.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="table-shell">
              <table className="table">
                <thead>
                  <tr>
                    <th>Arena</th>
                    <th>Status</th>
                    <th>Broadcast</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {settings.arenas.map((arena) => (
                    <tr key={arena.id}>
                      <td>
                        <strong>{arena.name}</strong>
                        <div className="compact-copy">{arena.locationLabel}</div>
                      </td>
                      <td>{arena.status}</td>
                      <td>{arena.supportsBroadcast ? 'Yes' : 'No'}</td>
                      <td>
                        <button className="action-button" onClick={() => removeArena(arena.id)} disabled={settings.arenas.length <= 1}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="form-grid">
              <label className="field-stack">
                <span className="info-label">Arena ID</span>
                <input value={draftArena.id} onChange={(event) => setDraftArena({ ...draftArena, id: event.target.value })} style={inputStyle} />
              </label>
              <label className="field-stack">
                <span className="info-label">Arena name</span>
                <input value={draftArena.name} onChange={(event) => setDraftArena({ ...draftArena, name: event.target.value })} style={inputStyle} />
              </label>
              <label className="field-stack">
                <span className="info-label">Location label</span>
                <input value={draftArena.locationLabel} onChange={(event) => setDraftArena({ ...draftArena, locationLabel: event.target.value })} style={inputStyle} />
              </label>
              <label className="field-stack">
                <span className="info-label">Surface</span>
                <input value={draftArena.surfaceType} onChange={(event) => setDraftArena({ ...draftArena, surfaceType: event.target.value })} style={inputStyle} />
              </label>
            </div>
            <button className="action-button" onClick={addArena}>
              Add Arena
            </button>
          </div>
        </div>

        <div className="metric-card">
          <p className="eyebrow">License & Support</p>
          <p className="panel-title">Commercial control, support posture, and remote diagnostics</p>
          <div className="form-grid">
            <label className="field-stack">
              <span className="info-label">Licensed to</span>
              <input value={settings.license.licensedTo} onChange={(event) => setSettings({ ...settings, license: { ...settings.license, licensedTo: event.target.value } })} style={inputStyle} />
            </label>
            <label className="field-stack">
              <span className="info-label">License key</span>
              <input value={settings.license.licenseKey} onChange={(event) => setSettings({ ...settings, license: { ...settings.license, licenseKey: event.target.value } })} style={inputStyle} />
            </label>
            <label className="field-stack">
              <span className="info-label">Deployment ID</span>
              <input value={settings.license.deploymentId} onChange={(event) => setSettings({ ...settings, license: { ...settings.license, deploymentId: event.target.value } })} style={inputStyle} />
            </label>
            <label className="field-stack">
              <span className="info-label">Support tier</span>
              <select value={settings.license.supportTier} onChange={(event) => setSettings({ ...settings, license: { ...settings.license, supportTier: event.target.value as AppSettings['license']['supportTier'] } })} style={inputStyle}>
                <option value="STANDARD">Standard</option>
                <option value="PRIORITY">Priority</option>
                <option value="EVENT_CRITICAL">Event Critical</option>
              </select>
            </label>
            <label className="field-stack">
              <span className="info-label">Max arenas</span>
              <input type="number" value={settings.license.maxArenas} onChange={(event) => setSettings({ ...settings, license: { ...settings.license, maxArenas: Number(event.target.value) } })} style={inputStyle} />
            </label>
            <label className="field-stack">
              <span className="info-label">Operator seats</span>
              <input type="number" value={settings.license.maxOperatorSeats} onChange={(event) => setSettings({ ...settings, license: { ...settings.license, maxOperatorSeats: Number(event.target.value) } })} style={inputStyle} />
            </label>
            <ToggleRow label="Remote assistance enabled" value={settings.support.remoteAssistEnabled} onToggle={() => setSettings({ ...settings, support: { ...settings.support, remoteAssistEnabled: !settings.support.remoteAssistEnabled } })} />
            <ToggleRow label="Diagnostics sharing approved" value={settings.license.diagnosticsSharingApproved} onToggle={() => setSettings({ ...settings, license: { ...settings.license, diagnosticsSharingApproved: !settings.license.diagnosticsSharingApproved } })} />
          </div>
        </div>
      </div>

      <div className="section-grid admin-two-panel">
        <div className="metric-card surface-soft">
          <p className="eyebrow">Diagnostics Bundle</p>
          <p className="panel-title">Remote support snapshot</p>
          <div className="info-list">
            <div className="info-row">
              <span className="info-label">Generated</span>
              <span className="info-value">{bundle ? new Date(bundle.generatedAt).toLocaleString() : '--'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Active arena</span>
              <span className="info-value">{bundle?.site.activeArenaName ?? activeArena?.name ?? '--'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Hardware source</span>
              <span className="info-value">{bundle ? `${bundle.hardware.status.source} · ${bundle.hardware.status.mode}` : '--'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Disconnects</span>
              <span className="info-value">{bundle?.summary.hardwareDisconnects ?? '--'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Audit rows</span>
              <span className="info-value">{bundle?.recentAudit.length ?? '--'}</span>
            </div>
          </div>
          <div className="warning-banner" style={{ marginTop: 16, color: '#334155', background: 'rgba(15,23,42,0.04)', borderColor: 'rgba(15,23,42,0.08)' }}>
            Built for remote support handoff, venue diagnostics review, and post-incident escalation without converting the product into a SaaS platform.
          </div>
        </div>

        <div className="metric-card">
          <p className="eyebrow">Readiness Notes</p>
          <p className="panel-title">Current enterprise posture</p>
          <ul className="documentation-list">
            <li>{settings.deployment.enforceLanOnly ? 'LAN-only routing is active for safer venue use.' : 'External routing is permitted; review exposure before go-live.'}</li>
            <li>{settings.arenas.length} arena profile(s) are available for multi-arena event operations.</li>
            <li>{settings.support.remoteAssistEnabled ? 'Remote support tooling is enabled.' : 'Remote support tooling is disabled; use exported diagnostics bundles.'}</li>
            <li>Last saved {savedAt || 'not yet in this session'}.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
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
  padding: '12px 14px',
  borderRadius: 16,
  border: '1px solid rgba(15, 23, 42, 0.09)',
  background: '#ffffff',
  color: '#142033',
};
