'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPatch, apiPost } from '../../lib/api';

type Preflight = {
  generatedAt: string;
  overallStatus: 'pass' | 'warn' | 'fail';
  summary: string;
  blockers: string[];
  checks: Array<{
    id: string;
    label: string;
    status: 'pass' | 'warn' | 'fail';
    detail: string;
    action: string;
  }>;
};

type HealthReport = {
  generatedAt: string;
  status: 'healthy' | 'degraded' | 'critical';
  executiveSummary: string;
  platformProfile: {
    product: string;
    organization: string;
    venueName: string;
    activeArena: string;
    deploymentMode: string;
    localBaseUrl: string;
    lanOnly: boolean;
  };
  technicalProfile: {
    frontend: string;
    backend: string;
    realtime: string;
    persistence: string[];
    hardwareModes: string[];
    broadcast: string[];
    recoveryCapabilities: string[];
  };
  readiness: {
    postgres: boolean;
    redis: boolean;
    hardwareConnected: boolean;
    hardwareSource: 'simulated' | 'physical';
    vmixEnabled: boolean;
    spectatorEnabled: boolean;
  };
  recommendedActions: string[];
};

type DashboardRealtime = {
  readiness: 'ready' | 'degraded' | 'simulated';
  goLive: {
    allowed: boolean;
    blockers: string[];
  };
  hardware: {
    connected: boolean;
    mode: string;
    source: 'simulated' | 'physical';
    parserRuleCount?: number;
    lastMessageAt?: string;
  };
  timing: {
    state: string;
    eventName: string;
    className: string;
  };
  persistence: {
    postgres: boolean;
    redis: boolean;
  };
  analysis: Array<{
    level: 'ok' | 'warn' | 'critical';
    title: string;
    detail: string;
  }>;
};

type SystemLogs = {
  generatedAt: string;
  audit: Array<{
    id: string;
    actor: string;
    action: string;
    entityType: string;
    entityId: string;
    createdAt: string;
  }>;
  hardwareDiagnostics: Array<{
    id: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    createdAt: string;
  }>;
  hardwareLogs: Array<{
    source: string;
    port: string;
    payload: string;
    receivedAt: string;
    parsed?: {
      type?: string;
      channel?: string;
    } | null;
  }>;
  vmixTelemetry: Array<{
    ok: boolean;
    at: string;
    url: string;
    reason?: string;
    attempts?: number;
    simulated?: boolean;
  }>;
};

type IncidentEntry = {
  id: string;
  title: string;
  detail: string;
  level: 'critical' | 'warn' | 'info';
  source: 'SYSTEM' | 'HARDWARE' | 'VMIX' | 'OPERATOR';
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  createdAt: string;
  notes?: string;
};

function statusWeight(status: 'pass' | 'warn' | 'fail') {
  if (status === 'pass') {
    return 1;
  }
  if (status === 'warn') {
    return 0.6;
  }
  return 0;
}

function formatDateTime(value?: string) {
  if (!value) {
    return '--';
  }

  return new Date(value).toLocaleString();
}

export function StatusConsole() {
  const [preflight, setPreflight] = useState<Preflight | null>(null);
  const [healthReport, setHealthReport] = useState<HealthReport | null>(null);
  const [dashboard, setDashboard] = useState<DashboardRealtime | null>(null);
  const [logs, setLogs] = useState<SystemLogs | null>(null);
  const [incidents, setIncidents] = useState<IncidentEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAll() {
    setError(null);
    try {
      const [nextPreflight, nextHealth, nextDashboard, nextLogs, nextIncidents] = await Promise.all([
        apiGet<Preflight>('/system/preflight-checks'),
        apiPost<HealthReport>('/system/generate-health-report'),
        apiGet<DashboardRealtime>('/dashboard/realtime'),
        apiGet<SystemLogs>('/logs/system'),
        apiGet<IncidentEntry[]>('/incidents'),
      ]);
      setPreflight(nextPreflight);
      setHealthReport(nextHealth);
      setDashboard(nextDashboard);
      setLogs(nextLogs);
      setIncidents(nextIncidents);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Unable to load status data.');
    }
  }

  useEffect(() => {
    let mounted = true;

    async function safeLoad() {
      if (!mounted) {
        return;
      }
      await loadAll();
    }

    void safeLoad();
    const interval = window.setInterval(() => {
      void safeLoad();
    }, 3000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const healthPercent = useMemo(() => {
    if (!preflight || !dashboard || !healthReport) {
      return 0;
    }

    const checkScore = preflight.checks.length
      ? preflight.checks.reduce((sum, item) => sum + statusWeight(item.status), 0) / preflight.checks.length
      : 0;
    const readinessFlags = [
      healthReport.readiness.postgres,
      healthReport.readiness.redis,
      healthReport.readiness.hardwareConnected,
      healthReport.readiness.vmixEnabled || !dashboard.goLive.blockers.some((item) => item.toLowerCase().includes('vmix')),
      healthReport.readiness.spectatorEnabled,
      dashboard.goLive.allowed,
    ];
    const readinessScore = readinessFlags.filter(Boolean).length / readinessFlags.length;
    const platformScore = healthReport.status === 'healthy' ? 1 : healthReport.status === 'degraded' ? 0.7 : 0.35;

    return Math.max(0, Math.min(100, Math.round(((checkScore * 0.5) + (readinessScore * 0.3) + (platformScore * 0.2)) * 100)));
  }, [dashboard, healthReport, preflight]);

  const autoIncidents = useMemo(() => {
    const incidents: Array<{ level: 'critical' | 'warn'; title: string; detail: string }> = [];

    if (preflight) {
      for (const blocker of preflight.blockers) {
        incidents.push({
          level: 'critical',
          title: 'Go-live blocker',
          detail: blocker,
        });
      }
    }

    for (const item of dashboard?.analysis ?? []) {
      if (item.level === 'warn' || item.level === 'critical') {
        incidents.push({
          level: item.level,
          title: item.title,
          detail: item.detail,
        });
      }
    }

    for (const item of logs?.hardwareDiagnostics ?? []) {
      if (item.level === 'warn' || item.level === 'error') {
        incidents.push({
          level: item.level === 'error' ? 'critical' : 'warn',
          title: 'Hardware diagnostic',
          detail: `${item.message} (${formatDateTime(item.createdAt)})`,
        });
      }
    }

    for (const item of healthReport?.recommendedActions ?? []) {
      incidents.push({
        level: 'warn',
        title: 'Recommended action',
        detail: item,
      });
    }

    return incidents.slice(0, 12);
  }, [dashboard, healthReport, logs, preflight]);

  async function refreshReport() {
    setBusy(true);
    try {
      await loadAll();
    } finally {
      setBusy(false);
    }
  }

  function downloadReport() {
    if (!healthReport || !preflight || !dashboard || !logs) {
      return;
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      healthPercent,
      preflight,
      healthReport,
      dashboard,
      logs,
      autoIncidents,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `surgetimer-status-report-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function downloadBackupPack() {
    setBusy(true);
    try {
      const payload = await apiGet<Record<string, unknown>>('/system/backup-pack');
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `surgetimer-backup-pack-${Date.now()}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  async function acknowledgeIncident(id: string) {
    setBusy(true);
    try {
      await apiPatch<IncidentEntry>(`/incidents/${id}/acknowledge`, { actor: 'super-admin@surgetimer.local' });
      await loadAll();
    } finally {
      setBusy(false);
    }
  }

  async function resolveIncident(id: string) {
    setBusy(true);
    try {
      await apiPatch<IncidentEntry>(`/incidents/${id}/resolve`, {
        actor: 'super-admin@surgetimer.local',
        notes: 'Resolved from status console.',
      });
      await loadAll();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="section-stack">
      <section className="status-overview">
        <div className="status-score-card">
          <div
            className="status-score-ring"
            style={{ background: `conic-gradient(var(--accent) 0deg ${healthPercent * 3.6}deg, rgba(15, 23, 42, 0.08) ${healthPercent * 3.6}deg 360deg)` }}
          >
            <div className="status-score-core">
              <span className="status-score-value">{healthPercent}%</span>
              <span className="status-score-label">Health</span>
            </div>
          </div>
          <div className="status-score-copy">
            <p className="eyebrow">Live Software Health</p>
            <p className="panel-title">Operational confidence, readiness posture, and runtime pressure</p>
            <p className="hero-copy" style={{ marginTop: 0 }}>
              {healthReport?.executiveSummary ?? 'Loading live health summary.'}
            </p>
            <div className="status-chip-row">
              <span className={`status-chip ${healthReport?.status === 'critical' ? 'danger' : healthReport?.status === 'degraded' ? 'warn' : 'ok'}`}>
                {healthReport?.status ?? 'loading'}
              </span>
              <span className={`status-chip ${dashboard?.goLive.allowed ? 'ok' : 'danger'}`}>
                {dashboard?.goLive.allowed ? 'Go-live allowed' : 'Go-live blocked'}
              </span>
              <span className={`status-chip ${dashboard?.hardware.connected && dashboard.hardware.source === 'physical' ? 'ok' : 'warn'}`}>
                {dashboard?.hardware.connected
                  ? dashboard.hardware.source === 'physical'
                    ? `ALGE ${dashboard.hardware.mode}`
                    : `Simulator ${dashboard.hardware.mode}`
                  : 'Hardware offline'}
              </span>
            </div>
          </div>
        </div>

        <div className="status-actions">
          <button className="button-primary" onClick={() => void refreshReport()} disabled={busy}>
            {busy ? 'Refreshing...' : 'Refresh Status'}
          </button>
          <button className="button-secondary" onClick={downloadReport} disabled={!healthReport}>
            Download Status Report
          </button>
          <button className="button-secondary" onClick={() => void downloadBackupPack()} disabled={busy}>
            Download Backup Pack
          </button>
        </div>
        {error ? <div className="inline-alert danger">{error}</div> : null}
      </section>

      <div className="dashboard-kpi-grid live">
        <div className="kpi-card">
          <div className="kpi-label">Readiness</div>
          <div className="kpi-value">{dashboard?.readiness ?? '--'}</div>
          <div className="kpi-delta">Current runtime posture</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Test Checks</div>
          <div className="kpi-value">{preflight?.checks.filter((item) => item.status === 'pass').length ?? 0}/{preflight?.checks.length ?? 0}</div>
          <div className="kpi-delta">Pre-event checks currently passing</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Auto Incidents</div>
          <div className="kpi-value">{autoIncidents.length}</div>
          <div className="kpi-delta">Warnings and blockers detected automatically</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Audit Entries</div>
          <div className="kpi-value">{logs?.audit.length ?? 0}</div>
          <div className="kpi-delta">Tracked actions in the current runtime ledger</div>
        </div>
      </div>

      <div className="dashboard-board status-board">
        <section className="metric-card">
          <p className="eyebrow">Incident Center</p>
          <p className="panel-title">Tracked operational incidents and acknowledgements</p>
          <div className="status-log-stack">
            {incidents.length ? incidents.slice(0, 8).map((item) => (
              <div key={item.id} className="status-log-item">
                <span className={`status-chip ${item.level === 'critical' ? 'danger' : item.level === 'warn' ? 'warn' : 'ok'}`}>{item.status}</span>
                <div>
                  <div className="compact-title">{item.title}</div>
                  <div className="compact-copy">{item.detail}</div>
                  <div className="status-actions" style={{ marginTop: 10 }}>
                    {item.status === 'OPEN' ? <button className="button-secondary" onClick={() => void acknowledgeIncident(item.id)} disabled={busy}>Acknowledge</button> : null}
                    {item.status !== 'RESOLVED' ? <button className="button-secondary" onClick={() => void resolveIncident(item.id)} disabled={busy}>Resolve</button> : null}
                  </div>
                </div>
              </div>
            )) : <div className="empty-state">No persistent incident entries yet.</div>}
          </div>
        </section>

        <section className="metric-card">
          <p className="eyebrow">Auto-Detected Issues</p>
          <p className="panel-title">Runtime anomalies and bug-report candidates</p>
          <div className="compact-table">
            {autoIncidents.length ? autoIncidents.map((item, index) => (
              <div key={`${item.title}-${index}`} className="compact-row">
                <div className={`compact-status ${item.level === 'critical' ? 'danger' : 'warn'}`}>{item.level}</div>
                <div>
                  <div className="compact-title">{item.title}</div>
                  <div className="compact-copy">{item.detail}</div>
                </div>
              </div>
            )) : (
              <div className="empty-state">No automatic blockers or issue candidates are currently active.</div>
            )}
          </div>
        </section>

        <section className="metric-card">
          <p className="eyebrow">Core Runtime</p>
          <p className="panel-title">Live software state, dependencies, and active arena</p>
          <div className="info-list">
            <div className="info-row"><span className="info-label">Venue</span><span className="info-value">{healthReport?.platformProfile.venueName ?? '--'}</span></div>
            <div className="info-row"><span className="info-label">Arena</span><span className="info-value">{healthReport?.platformProfile.activeArena ?? '--'}</span></div>
            <div className="info-row"><span className="info-label">Event</span><span className="info-value">{dashboard?.timing.eventName ?? '--'}</span></div>
            <div className="info-row"><span className="info-label">Class</span><span className="info-value">{dashboard?.timing.className ?? '--'}</span></div>
            <div className="info-row"><span className="info-label">Timer state</span><span className="info-value">{dashboard?.timing.state ?? '--'}</span></div>
            <div className="info-row"><span className="info-label">Deployment</span><span className="info-value">{healthReport?.platformProfile.deploymentMode ?? '--'}</span></div>
            <div className="info-row"><span className="info-label">Postgres</span><span className="info-value">{dashboard?.persistence.postgres ? 'Online' : 'Offline'}</span></div>
            <div className="info-row"><span className="info-label">Redis</span><span className="info-value">{dashboard?.persistence.redis ? 'Online' : 'Offline'}</span></div>
          </div>
        </section>
      </div>

      <div className="dashboard-board status-board">
        <section className="metric-card">
          <p className="eyebrow">Pre-Event Verification</p>
          <p className="panel-title">Step-by-step readiness checks and pass status</p>
          <div className="report-table">
            <div className="report-row report-head">
              <span>Check</span>
              <span>Status</span>
              <span>Detail</span>
            </div>
            {(preflight?.checks ?? []).map((item) => (
              <div key={item.id} className="report-row">
                <span>{item.label}</span>
                <span className={`table-status ${item.status}`}>{item.status}</span>
                <span>{item.detail}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="metric-card">
          <p className="eyebrow">Technical Profile</p>
          <p className="panel-title">In-depth software details for support and deployment review</p>
          <div className="status-tech-grid">
            <div className="status-tech-card">
              <span className="status-tech-label">Frontend</span>
              <strong>{healthReport?.technicalProfile.frontend ?? '--'}</strong>
            </div>
            <div className="status-tech-card">
              <span className="status-tech-label">Backend</span>
              <strong>{healthReport?.technicalProfile.backend ?? '--'}</strong>
            </div>
            <div className="status-tech-card">
              <span className="status-tech-label">Realtime</span>
              <strong>{healthReport?.technicalProfile.realtime ?? '--'}</strong>
            </div>
            <div className="status-tech-card">
              <span className="status-tech-label">Recovery</span>
              <strong>{healthReport?.technicalProfile.recoveryCapabilities.join(', ') ?? '--'}</strong>
            </div>
          </div>
        </section>
      </div>

      <div className="dashboard-board status-board">
        <section className="metric-card">
          <p className="eyebrow">Audit Log</p>
          <p className="panel-title">Tracked actions across runtime, operators, and system recovery</p>
          <div className="report-table">
            <div className="report-row report-head">
              <span>Time</span>
              <span>Actor</span>
              <span>Action</span>
              <span>Entity</span>
            </div>
            {(logs?.audit ?? []).slice(0, 16).map((item) => (
              <div key={item.id} className="report-row">
                <span>{formatDateTime(item.createdAt)}</span>
                <span>{item.actor}</span>
                <span>{item.action}</span>
                <span>{item.entityType}:{item.entityId}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="metric-card">
          <p className="eyebrow">Hardware + Broadcast Logs</p>
          <p className="panel-title">Latest diagnostics, raw payloads, and vMix execution attempts</p>
          <div className="status-log-stack">
            {(logs?.hardwareDiagnostics ?? []).slice(0, 6).map((item) => (
              <div key={item.id} className="status-log-item">
                <span className={`status-chip ${item.level === 'error' ? 'danger' : item.level === 'warn' ? 'warn' : 'ok'}`}>{item.level}</span>
                <div>
                  <div className="compact-title">{item.message}</div>
                  <div className="compact-copy">{formatDateTime(item.createdAt)}</div>
                </div>
              </div>
            ))}
            {(logs?.hardwareLogs ?? []).slice(0, 4).map((item, index) => (
              <div key={`${item.receivedAt}-${index}`} className="status-log-item">
                <span className="status-chip">hw</span>
                <div>
                  <div className="compact-title">{item.payload}</div>
                  <div className="compact-copy">
                    {item.parsed?.type ?? 'UNKNOWN'} / {item.parsed?.channel ?? '--'} / {formatDateTime(item.receivedAt)}
                  </div>
                </div>
              </div>
            ))}
            {(logs?.vmixTelemetry ?? []).slice(0, 4).map((item, index) => (
              <div key={`${item.at}-${index}`} className="status-log-item">
                <span className={`status-chip ${item.ok ? 'ok' : 'danger'}`}>vmix</span>
                <div>
                  <div className="compact-title">{item.ok ? 'Command delivered' : 'Command failed'}</div>
                  <div className="compact-copy">{item.reason ?? item.url} / {formatDateTime(item.at)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
