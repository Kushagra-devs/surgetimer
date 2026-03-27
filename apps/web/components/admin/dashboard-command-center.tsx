'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { io } from 'socket.io-client';
import { apiGet, apiPost } from '../../lib/api';
import { DEFAULT_PUBLIC_API_BASE_URL } from '../../lib/runtime-config';

const API_BASE = DEFAULT_PUBLIC_API_BASE_URL;

type DashboardRealtime = {
  at: string;
  readiness: 'ready' | 'degraded' | 'simulated';
  goLive: {
    allowed: boolean;
    blockers: string[];
    policy: {
      freezeConfigurationDuringLiveRound: boolean;
      allowManualFallbackStart: boolean;
      minimumReadyCompetitors: number;
    };
  };
  timing: {
    state: string;
    elapsedMs: number;
    competitor?: {
      riderName?: string;
      horseName?: string;
      bibNumber?: string;
      status?: string;
    } | null;
    className: string;
    eventName: string;
  };
  hardware: {
    connected: boolean;
    mode: string;
    source: 'simulated' | 'physical';
  };
  vmix: {
    enabled: boolean;
  };
  queue: {
    total: number;
    ready: number;
    staged: number;
  };
  persistence: {
    postgres: boolean;
    redis: boolean;
  };
  reports: {
    duplicateSignals: number;
    hardwareDisconnects: number;
    completedRuns: number;
    totalCompetitors?: number;
  };
  analysis: Array<{
    level: 'ok' | 'warn' | 'critical';
    title: string;
    detail: string;
  }>;
};

function formatElapsed(elapsedMs: number) {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  const centiseconds = String(Math.floor((elapsedMs % 1000) / 10)).padStart(2, '0');
  return `${minutes}:${seconds}.${centiseconds}`;
}

export function DashboardCommandCenter() {
  const [status, setStatus] = useState<DashboardRealtime | null>(null);
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [recovering, setRecovering] = useState<'cache' | 'restart' | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function load() {
      const next = await apiGet<DashboardRealtime>('/dashboard/realtime');
      if (mounted) {
        setStatus(next);
      }
    }

    void load();
    const socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => void load());
    socket.on('timing.state.updated', () => void load());
    socket.on('hardware.status.updated', () => void load());
    socket.on('overlay.updated', () => void load());
    socket.on('run.completed', () => void load());

    const interval = window.setInterval(() => void load(), 2000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      socket.close();
    };
  }, []);

  const priority = useMemo(() => {
    const item = status?.analysis.find((entry) => entry.level !== 'ok') ?? status?.analysis[0] ?? null;
    return item;
  }, [status]);

  async function clearCacheAndRefresh() {
    setRecovering('cache');
    setRecoveryMessage('');
    try {
      const response = await apiPost<{ message: string }>('/system/clear-cache', {});
      setRecoveryMessage(response.message);
      router.refresh();
      window.location.reload();
    } finally {
      setRecovering(null);
    }
  }

  async function restartRuntime() {
    setRecovering('restart');
    setRecoveryMessage('');
    try {
      const response = await apiPost<{ message: string }>('/system/restart-runtime', {});
      setRecoveryMessage(response.message);
      router.refresh();
      window.setTimeout(() => {
        window.location.reload();
      }, 600);
    } finally {
      setRecovering(null);
    }
  }

  return (
    <section className="dashboard-command">
      <div className={`ops-banner ${status?.readiness === 'ready' ? 'ok' : 'warn'}`}>
        <div>
          <p className="eyebrow">Operations Status</p>
          <h2 className="ops-banner-title">
            {status?.readiness === 'ready'
              ? 'Live timing ready.'
              : status?.readiness === 'simulated'
                ? 'Simulator mode active.'
                : 'Attention required before go-live.'}
          </h2>
        </div>
        <div className="ops-banner-meta">
          <span className="status-dot" />
          <span>{status?.timing.state ?? 'Loading state'}</span>
          <span className="ops-banner-divider" />
          <span>{status?.timing.className ?? 'Awaiting class'}</span>
        </div>
      </div>

      {status && !status.goLive.allowed ? (
        <div className="incident-strip critical">
          <strong>Go-live blocked</strong>
          <span>{status.goLive.blockers[0] ?? 'One or more readiness policies are failing.'}</span>
        </div>
      ) : null}

      <div className="dashboard-exec-grid">
        <div className="dashboard-primary-card">
          <div className="panel-header-row">
            <div>
              <p className="eyebrow">Live Arena</p>
              <p className="panel-title">Current timing and active competitor</p>
            </div>
            <div className="timer-chip">{formatElapsed(status?.timing.elapsedMs ?? 0)}</div>
          </div>

          <div className="command-feature-grid">
            <div className="command-feature-block">
              <span className="command-feature-label">Rider</span>
              <strong className="command-feature-value">{status?.timing.competitor?.riderName ?? 'Awaiting rider'}</strong>
            </div>
            <div className="command-feature-block">
              <span className="command-feature-label">Horse</span>
              <strong className="command-feature-value">{status?.timing.competitor?.horseName ?? 'Awaiting horse'}</strong>
            </div>
            <div className="command-feature-block">
              <span className="command-feature-label">Bib</span>
              <strong className="command-feature-value">{status?.timing.competitor?.bibNumber ?? '--'}</strong>
            </div>
            <div className="command-feature-block">
              <span className="command-feature-label">Queue Ready</span>
              <strong className="command-feature-value">{status?.queue.ready ?? 0}</strong>
            </div>
            <div className="command-feature-block">
              <span className="command-feature-label">Go-live</span>
              <strong className="command-feature-value">{status?.goLive.allowed ? 'Allowed' : 'Blocked'}</strong>
            </div>
            <div className="command-feature-block">
              <span className="command-feature-label">Fallback</span>
              <strong className="command-feature-value">{status?.goLive.policy.allowManualFallbackStart ? 'Manual' : 'Hardware only'}</strong>
            </div>
          </div>

          <div className="action-strip">
            <a className="action-button accent" href="/judge">
              Judge Console
            </a>
            <a className="action-button" href="/queue">
              Queue Control
            </a>
            <a className="action-button" href="/hardware-console">
              Hardware Console
            </a>
            <a className="action-button" href="/overlay-preview">
              Overlay Output
            </a>
            <button className="action-button" onClick={() => void clearCacheAndRefresh()} disabled={recovering !== null}>
              {recovering === 'cache' ? 'Clearing Cache...' : 'Clear Cache'}
            </button>
            <button className="action-button" onClick={() => void restartRuntime()} disabled={recovering !== null}>
              {recovering === 'restart' ? 'Restarting Runtime...' : 'Force Runtime Restart'}
            </button>
          </div>
          {recoveryMessage ? <div className="incident-strip warn" style={{ marginTop: 14 }}>{recoveryMessage}</div> : null}
        </div>

        <div className="dashboard-secondary-stack">
          <div className="metric-card tight-card">
            <p className="eyebrow">Priority</p>
            <p className="panel-title">{priority?.title ?? 'Loading live analysis'}</p>
            <p className="muted">{priority?.detail ?? 'Connecting to realtime dashboard telemetry.'}</p>
          </div>

          <div className="metric-card tight-card">
            <p className="eyebrow">Dependencies</p>
            <div className="mini-status-list">
              <div className="mini-status-row"><span>Hardware</span><strong>{status?.hardware.connected ? `${status.hardware.source === 'physical' ? 'ALGE' : 'Simulator'} ${status.hardware.mode}` : 'Offline'}</strong></div>
              <div className="mini-status-row"><span>Postgres</span><strong>{status?.persistence.postgres ? 'Online' : 'Offline'}</strong></div>
              <div className="mini-status-row"><span>Redis</span><strong>{status?.persistence.redis ? 'Online' : 'Offline'}</strong></div>
              <div className="mini-status-row"><span>vMix</span><strong>{status?.vmix.enabled ? 'Enabled' : 'Manual mode'}</strong></div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-kpi-grid live">
        <div className="kpi-card">
          <div className="kpi-label">Completed Runs</div>
          <div className="kpi-value">{status?.reports.completedRuns ?? 0}</div>
          <div className="kpi-delta">Live competition completions</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Queue Total</div>
          <div className="kpi-value">{status?.queue.total ?? 0}</div>
          <div className="kpi-delta">{status?.queue.staged ?? 0} staged for continuation</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Duplicate Signals</div>
          <div className="kpi-value">{status?.reports.duplicateSignals ?? 0}</div>
          <div className="kpi-delta">Signal integrity watch</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Disconnect Events</div>
          <div className="kpi-value">{status?.reports.hardwareDisconnects ?? 0}</div>
          <div className="kpi-delta">Hardware interruption history</div>
        </div>
      </div>
    </section>
  );
}
