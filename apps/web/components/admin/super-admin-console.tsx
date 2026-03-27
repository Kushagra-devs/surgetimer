'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { apiGet, apiPatch, apiPost } from '../../lib/api';
import type { AppSettings, AppUser, AuditEntry, ReportSummary } from '@horse-timer/types';
import { IntegrationConsole } from './integration-console';
import { LiveShareConsole } from './live-share-console';
import { OverlayStudio } from './overlay-studio';
import { PlatformEnterpriseConsole } from './platform-enterprise-console';
import { SpectatorSettingsConsole } from './spectator-settings-console';
import { WidgetManager } from './widget-manager';

const blankUser = {
  name: '',
  email: '',
  role: 'VIEWER',
};

const tabs = [
  { id: 'overview', label: 'Overview', caption: 'Executive summary, posture, and next actions' },
  { id: 'platform', label: 'Platform Profile', caption: 'Branding, arenas, deployment, licensing, and support' },
  { id: 'operations', label: 'Operations Policy', caption: 'Timing defaults, venue rules, and runtime policy' },
  { id: 'people', label: 'Users & Access', caption: 'Role control, activation, and governance' },
  { id: 'integrations', label: 'Integrations', caption: 'ALGE, parser rules, diagnostics, and vMix' },
  { id: 'broadcast', label: 'Broadcast & Share', caption: 'Overlay, widgets, spectator view, and QR flows' },
  { id: 'audit', label: 'Audit & Oversight', caption: 'Traceability, recent actions, and accountability' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function SuperAdminConsole() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [newUser, setNewUser] = useState(blankUser);

  async function load() {
    const [userData, settingsData, auditData, summaryData] = await Promise.all([
      apiGet<AppUser[]>('/users'),
      apiGet<AppSettings>('/settings/app'),
      apiGet<AuditEntry[]>('/logs/audit'),
      apiGet<ReportSummary>('/reports/summary'),
    ]);
    setUsers(userData);
    setSettings(settingsData);
    setAudit(auditData);
    setSummary(summaryData);
  }

  useEffect(() => {
    void load();
  }, []);

  const activeUserCount = useMemo(() => users.filter((user) => user.status === 'ACTIVE').length, [users]);
  const activeTabMeta = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  async function inviteUser() {
    await apiPost('/users', newUser);
    setNewUser(blankUser);
    await load();
  }

  async function toggleUser(user: AppUser) {
    await apiPatch(`/users/${user.id}`, {
      status: user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
    });
    await load();
  }

  async function saveSettings() {
    await apiPost('/settings/app', settings);
    await load();
  }

  return (
    <div className="super-admin-shell">
      <aside className="super-admin-rail">
        <div className="metric-card super-admin-rail-card">
          <p className="eyebrow">Control Center</p>
          <p className="panel-title">Super Admin</p>
          <p className="muted" style={{ marginTop: 0 }}>
            Policy, integrations, governance, and broadcast surfaces are separated here so live operators are not overloaded.
          </p>

          <div className="super-admin-kpis">
            <div className="super-admin-kpi">
              <span>Events</span>
              <strong>{summary?.totalEvents ?? '--'}</strong>
            </div>
            <div className="super-admin-kpi">
              <span>Users</span>
              <strong>{activeUserCount}</strong>
            </div>
            <div className="super-admin-kpi">
              <span>Runs</span>
              <strong>{summary?.completedRuns ?? '--'}</strong>
            </div>
          </div>
        </div>

        <div className="super-admin-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`super-admin-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <strong>{tab.label}</strong>
              <span>{tab.caption}</span>
            </button>
          ))}
        </div>
      </aside>

      <div className="super-admin-main">
        <div className="metric-card super-admin-header-card">
          <p className="eyebrow">Current Workspace</p>
          <div className="split-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              <p className="panel-title" style={{ marginBottom: 6 }}>{activeTabMeta.label}</p>
              <p className="muted" style={{ marginTop: 0 }}>{activeTabMeta.caption}</p>
            </div>
            <div className="super-admin-chip-row">
              <span className="super-admin-chip">Compact control flow</span>
              <span className="super-admin-chip">Operations-safe</span>
              <span className="super-admin-chip">Enterprise segmentation</span>
            </div>
          </div>
        </div>

        {activeTab === 'overview' ? (
          <div className="section-stack">
            <div className="dashboard-kpi-grid live">
              <div className="kpi-card">
                <div className="kpi-label">Events</div>
                <div className="kpi-value">{summary?.totalEvents ?? '--'}</div>
                <div className="kpi-delta">Managed competition events</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Classes</div>
                <div className="kpi-value">{summary?.totalClasses ?? '--'}</div>
                <div className="kpi-delta">Configured class structures</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Arenas</div>
                <div className="kpi-value">{summary?.totalArenas ?? '--'}</div>
                <div className="kpi-delta">Venue profiles in rotation</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Active Users</div>
                <div className="kpi-value">{activeUserCount}</div>
                <div className="kpi-delta">Enabled operational accounts</div>
              </div>
              <div className="kpi-card">
                <div className="kpi-label">Hardware Alerts</div>
                <div className="kpi-value">{summary?.hardwareDisconnects ?? 0}</div>
                <div className="kpi-delta">Tracked disconnect events</div>
              </div>
            </div>

            <div className="section-grid">
              <div className="metric-card">
                <p className="eyebrow">Usage Model</p>
                <p className="panel-title">Recommended enterprise workflow</p>
                <div className="workflow-grid" style={{ gridTemplateColumns: '1fr' }}>
                  <div className="workflow-step">
                    <p className="workflow-step-title">Govern from policy, not from the live panel</p>
                    <p className="tip-copy">Use this area to define defaults, users, integrations, and broadcast assets while the judge console remains dedicated to timing execution.</p>
                  </div>
                  <div className="workflow-step">
                    <p className="workflow-step-title">Keep integrations visible and explicit</p>
                    <p className="tip-copy">ALGE and vMix belong in one operational category so readiness, parser rules, and deployment posture are easy to review.</p>
                  </div>
                  <div className="workflow-step">
                    <p className="workflow-step-title">Separate governance from content</p>
                    <p className="tip-copy">Users, audit, branding, spectator, and widgets are grouped by purpose to reduce admin friction.</p>
                  </div>
                </div>
              </div>

              <div className="metric-card">
                <p className="eyebrow">Quick Actions</p>
                <p className="panel-title">Most-used admin paths</p>
                <div className="button-grid">
                  <button className="action-button accent" onClick={() => setActiveTab('operations')}>
                    Timing Policy
                  </button>
                  <button className="action-button" onClick={() => setActiveTab('platform')}>
                    Platform Profile
                  </button>
                  <button className="action-button" onClick={() => setActiveTab('integrations')}>
                    ALGE & vMix
                  </button>
                  <button className="action-button" onClick={() => setActiveTab('people')}>
                    Users & Access
                  </button>
                  <button className="action-button" onClick={() => setActiveTab('broadcast')}>
                    Widgets & Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'platform' ? <PlatformEnterpriseConsole /> : null}

        {activeTab === 'operations' ? (
          <div className="metric-card">
            <p className="eyebrow">Operations Policy</p>
            <p className="panel-title">Venue defaults and timing behavior</p>
            <div className="form-grid">
              <label className="field-stack">
                <span className="info-label">Venue</span>
                <input
                  value={settings?.venueName ?? ''}
                  onChange={(event) => setSettings((current) => (current ? { ...current, venueName: event.target.value } : current))}
                  style={inputStyle}
                />
              </label>
              <label className="field-stack">
                <span className="info-label">Timezone</span>
                <input
                  value={settings?.timezone ?? ''}
                  onChange={(event) => setSettings((current) => (current ? { ...current, timezone: event.target.value } : current))}
                  style={inputStyle}
                />
              </label>
              <label className="field-stack">
                <span className="info-label">Debounce ms</span>
                <input
                  value={settings?.sensorDebounceMs ?? ''}
                  onChange={(event) => setSettings((current) => (current ? { ...current, sensorDebounceMs: Number(event.target.value) } : current))}
                  style={inputStyle}
                />
              </label>
              <label className="field-stack">
                <span className="info-label">Warmup sec</span>
                <input
                  value={settings?.warmupDurationSec ?? ''}
                  onChange={(event) => setSettings((current) => (current ? { ...current, warmupDurationSec: Number(event.target.value) } : current))}
                  style={inputStyle}
                />
              </label>
              <label className="field-stack">
                <span className="info-label">Max round sec</span>
                <input
                  value={settings?.maxRoundDurationSec ?? ''}
                  onChange={(event) => setSettings((current) => (current ? { ...current, maxRoundDurationSec: Number(event.target.value) } : current))}
                  style={inputStyle}
                />
              </label>
              <label className="field-stack">
                <span className="info-label">Widget width</span>
                <input
                  value={settings?.widgetWidth ?? ''}
                  onChange={(event) => setSettings((current) => (current ? { ...current, widgetWidth: Number(event.target.value) } : current))}
                  style={inputStyle}
                />
              </label>
              <label className="field-stack">
                <span className="info-label">Widget height</span>
                <input
                  value={settings?.widgetHeight ?? ''}
                  onChange={(event) => setSettings((current) => (current ? { ...current, widgetHeight: Number(event.target.value) } : current))}
                  style={inputStyle}
                />
              </label>
              <label className="field-stack">
                <span className="info-label">Always-on-top hint</span>
                <select
                  value={settings?.widgetAlwaysOnTopHint ? 'YES' : 'NO'}
                  onChange={(event) =>
                    setSettings((current) => (current ? { ...current, widgetAlwaysOnTopHint: event.target.value === 'YES' } : current))
                  }
                  style={inputStyle}
                >
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                </select>
              </label>
            </div>
            <div style={{ marginTop: 18 }}>
              <button className="action-button accent" onClick={() => void saveSettings()}>
                Save Operations Policy
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === 'people' ? (
          <div className="section-grid admin-two-panel">
            <div className="metric-card">
              <p className="eyebrow">Users & Access</p>
              <p className="panel-title">Role control and account status</p>
              <div className="table-shell">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>{user.status}</td>
                        <td>
                          <button className="action-button" onClick={() => void toggleUser(user)}>
                            {user.status === 'ACTIVE' ? 'Disable' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="metric-card surface-soft">
              <p className="eyebrow">Invite User</p>
              <p className="panel-title">Create a new account</p>
              <div className="info-list">
                <input
                  placeholder="Full name"
                  value={newUser.name}
                  onChange={(event) => setNewUser({ ...newUser, name: event.target.value })}
                  style={inputStyle}
                />
                <input
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(event) => setNewUser({ ...newUser, email: event.target.value })}
                  style={inputStyle}
                />
                <select
                  value={newUser.role}
                  onChange={(event) => setNewUser({ ...newUser, role: event.target.value })}
                  style={inputStyle}
                >
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="ADMIN">Admin</option>
                  <option value="JUDGE">Judge</option>
                  <option value="OPERATOR">Operator</option>
                  <option value="VIEWER">Viewer</option>
                </select>
                <button className="action-button accent" onClick={() => void inviteUser()}>
                  Invite User
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'integrations' ? <IntegrationConsole /> : null}

        {activeTab === 'broadcast' ? (
          <div className="section-stack">
            <LiveShareConsole />
            <SpectatorSettingsConsole />
            <OverlayStudio />
            <WidgetManager />
          </div>
        ) : null}

        {activeTab === 'audit' ? (
          <div className="metric-card">
            <p className="eyebrow">Audit & Oversight</p>
            <p className="panel-title">Recent administrative activity</p>
            <div className="table-shell">
              <table className="table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Actor</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.slice(0, 20).map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.action}</td>
                      <td>{entry.entityType}</td>
                      <td>{entry.actor}</td>
                      <td>{new Date(entry.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
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
