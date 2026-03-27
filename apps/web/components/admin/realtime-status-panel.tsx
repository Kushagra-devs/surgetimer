'use client';

import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { apiGet } from '../../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

type DashboardRealtime = {
  at: string;
  readiness: 'ready' | 'degraded' | 'simulated';
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
    lastSensorMessage?: {
      channel: string;
      at: string;
      rawPayload: string;
    } | null;
    warnings: string[];
  };
  hardware: {
    connected: boolean;
    mode: string;
    source: 'simulated' | 'physical';
    parserRuleCount?: number;
    lastMessage?: {
      payload?: string;
      receivedAt?: string;
      parsed?: {
        type?: string;
        channel?: string;
      };
    } | null;
  };
  vmix: {
    enabled: boolean;
    inputName: string;
    previewUrl: string;
    telemetry?: Array<{
      ok?: boolean;
      at?: string;
      reason?: string;
    }>;
  };
  queue: {
    total: number;
    ready: number;
    staged: number;
    preview: Array<{
      id: string;
      riderName: string;
      horseName: string;
      bibNumber: string;
      status: string;
    }>;
  };
  persistence: {
    postgres: boolean;
    redis: boolean;
  };
  reports: {
    duplicateSignals: number;
    hardwareDisconnects: number;
    completedRuns: number;
  };
  analysis: Array<{
    level: 'ok' | 'warn' | 'critical';
    title: string;
    detail: string;
  }>;
};

export function RealtimeStatusPanel() {
  const [status, setStatus] = useState<DashboardRealtime | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastRefreshMs, setLastRefreshMs] = useState(Date.now());
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const startedAt = performance.now();
      const next = await apiGet<DashboardRealtime>('/dashboard/realtime');
      if (!mounted) {
        return;
      }
      setStatus(next);
      setLastRefreshMs(Date.now());
      setLatencyMs(Math.round(performance.now() - startedAt));
    }

    void load();
    const socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setSocketConnected(true);
      void load();
    });
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('timing.state.updated', () => void load());
    socket.on('hardware.status.updated', () => void load());
    socket.on('overlay.updated', () => void load());
    socket.on('run.completed', () => void load());

    const interval = window.setInterval(() => {
      void load();
    }, 1500);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      socket.close();
    };
  }, []);

  const freshnessSeconds = useMemo(() => Math.max(0, Math.round((Date.now() - lastRefreshMs) / 1000)), [lastRefreshMs, status?.at]);
  const incident = useMemo(() => status?.analysis.find((item) => item.level !== 'ok') ?? null, [status]);

  return (
    <div className="metric-card">
      {incident ? (
        <div className={`incident-strip ${incident.level}`}>
          <strong>{incident.title}</strong>
          <span>{incident.detail}</span>
        </div>
      ) : null}

      <div className="split-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p className="eyebrow">Realtime Status</p>
          <p className="panel-title">Live dependencies, timing state, and operational risk</p>
        </div>
        <div className="realtime-badges">
          <span className={`health-badge ${socketConnected ? 'ok' : 'warn'}`}>{socketConnected ? 'Socket Live' : 'Socket Reconnecting'}</span>
          <span className={`health-badge ${status?.readiness === 'ready' ? 'ok' : 'warn'}`}>
            {status?.readiness === 'ready' ? 'Live Hardware Ready' : status?.readiness === 'simulated' ? 'Simulator Mode' : 'System Degraded'}
          </span>
          <span className="health-badge">{latencyMs !== null ? `${latencyMs}ms API` : '...'}</span>
        </div>
      </div>

      <div className="dashboard-realtime-grid">
        <section className="health-card">
          <p className="eyebrow">Timing Core</p>
          <div className="info-list">
            <div className="info-row"><span className="info-label">State</span><span className="info-value">{status?.timing.state ?? '--'}</span></div>
            <div className="info-row"><span className="info-label">Competitor</span><span className="info-value">{status?.timing.competitor?.riderName ?? 'Awaiting rider'}</span></div>
            <div className="info-row"><span className="info-label">Horse</span><span className="info-value">{status?.timing.competitor?.horseName ?? 'Awaiting horse'}</span></div>
            <div className="info-row"><span className="info-label">Bib</span><span className="info-value">{status?.timing.competitor?.bibNumber ?? '--'}</span></div>
            <div className="info-row"><span className="info-label">Class</span><span className="info-value">{status?.timing.className ?? '--'}</span></div>
          </div>
        </section>

        <section className="health-card">
          <p className="eyebrow">Dependencies</p>
          <div className="info-list">
            <div className="info-row"><span className="info-label">Hardware</span><span className="info-value">{status?.hardware.connected ? `${status.hardware.source === 'physical' ? 'ALGE' : 'Simulator'} connected (${status.hardware.mode})` : `${status?.hardware.source === 'physical' ? 'ALGE' : 'Simulator'} disconnected`}</span></div>
            <div className="info-row"><span className="info-label">Parser rules</span><span className="info-value">{status?.hardware.parserRuleCount ?? 0}</span></div>
            <div className="info-row"><span className="info-label">Postgres</span><span className="info-value">{status?.persistence.postgres ? 'Available' : 'Unavailable'}</span></div>
            <div className="info-row"><span className="info-label">Redis</span><span className="info-value">{status?.persistence.redis ? 'Available' : 'Unavailable'}</span></div>
            <div className="info-row"><span className="info-label">vMix</span><span className="info-value">{status?.vmix.enabled ? 'Enabled' : 'Disabled'}</span></div>
          </div>
        </section>

        <section className="health-card">
          <p className="eyebrow">Signal Flow</p>
          <div className="info-list">
            <div className="info-row"><span className="info-label">Last sensor</span><span className="info-value">{status?.timing.lastSensorMessage?.channel ?? '--'}</span></div>
            <div className="info-row"><span className="info-label">Payload</span><span className="info-value">{status?.hardware.lastMessage?.payload ?? '--'}</span></div>
            <div className="info-row"><span className="info-label">Parsed type</span><span className="info-value">{status?.hardware.lastMessage?.parsed?.type ?? '--'}</span></div>
            <div className="info-row"><span className="info-label">Updated</span><span className="info-value">{status?.hardware.lastMessage?.receivedAt ? new Date(status.hardware.lastMessage.receivedAt).toLocaleTimeString() : '--'}</span></div>
            <div className="info-row"><span className="info-label">Dashboard freshness</span><span className="info-value">{freshnessSeconds}s ago</span></div>
          </div>
        </section>
      </div>

      <div className="dashboard-realtime-grid" style={{ marginTop: 18 }}>
        <section className="metric-card surface-soft">
          <p className="eyebrow">Live Analysis</p>
          <div className="analysis-list">
            {(status?.analysis ?? []).map((item) => (
              <div key={`${item.title}-${item.detail}`} className={`analysis-item ${item.level}`}>
                <div className="analysis-title">{item.title}</div>
                <div className="analysis-copy">{item.detail}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="metric-card surface-soft">
          <p className="eyebrow">Queue and Telemetry</p>
          <div className="info-list">
            <div className="info-row"><span className="info-label">Queue total</span><span className="info-value">{status?.queue.total ?? 0}</span></div>
            <div className="info-row"><span className="info-label">Ready now</span><span className="info-value">{status?.queue.ready ?? 0}</span></div>
            <div className="info-row"><span className="info-label">Duplicate signals</span><span className="info-value">{status?.reports.duplicateSignals ?? 0}</span></div>
            <div className="info-row"><span className="info-label">Disconnect count</span><span className="info-value">{status?.reports.hardwareDisconnects ?? 0}</span></div>
            <div className="info-row"><span className="info-label">Completed runs</span><span className="info-value">{status?.reports.completedRuns ?? 0}</span></div>
          </div>
          <div className="compact-table" style={{ marginTop: 14 }}>
            {(status?.queue.preview ?? []).map((item, index) => (
              <div key={item.id} className="compact-row">
                <div className="compact-rank">{index + 1}</div>
                <div>
                  <div className="compact-title">{item.riderName} / {item.horseName}</div>
                  <div className="compact-copy">Bib {item.bibNumber}</div>
                </div>
                <div className="compact-status">{item.status}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
