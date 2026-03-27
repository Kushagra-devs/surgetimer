'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { apiGet } from '../../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

type ReportsSummary = {
  totalEvents: number;
  totalClasses: number;
  totalCompetitors: number;
  completedRuns: number;
  hardwareDisconnects: number;
  duplicateSignals: number;
};

type TimingHistory = Array<{
  id: string;
  competitor?: {
    riderName?: string;
    horseName?: string;
    bibNumber?: string;
  } | null;
  elapsedMs: number;
  state: string;
  mainStartedAt?: string | null;
  mainEndedAt?: string | null;
  finishReason?: string | null;
  manualOverrideUsed?: boolean;
  eventTrail?: Array<{
    id: string;
    at: string;
    eventType: string;
    previousState: string;
    nextState: string;
    accepted: boolean;
  }>;
}>;

type HardwareTelemetry = {
  status: {
    connected: boolean;
    mode: string;
    source: 'simulated' | 'physical';
    parserRuleCount?: number;
  };
  counters: {
    disconnects: number;
    duplicates: number;
    diagnostics: number;
    rawMessages: number;
  };
  diagnostics: Array<{
    id: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    createdAt: string;
  }>;
  logs: Array<{
    payload: string;
    receivedAt: string;
    source: string;
    parsed?: {
      type?: string;
      channel?: string;
    } | null;
  }>;
};

type DashboardRealtime = {
  readiness: 'ready' | 'degraded' | 'simulated';
  timing: {
    state: string;
    className: string;
    eventName: string;
  };
  persistence: {
    postgres: boolean;
    redis: boolean;
  };
  vmix: {
    enabled: boolean;
  };
};

function formatElapsed(elapsedMs: number) {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  const centiseconds = String(Math.floor((elapsedMs % 1000) / 10)).padStart(2, '0');
  return `${minutes}:${seconds}.${centiseconds}`;
}

export function RealtimeReportsConsole() {
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [history, setHistory] = useState<TimingHistory>([]);
  const [hardware, setHardware] = useState<HardwareTelemetry | null>(null);
  const [realtime, setRealtime] = useState<DashboardRealtime | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const [nextSummary, nextHistory, nextHardware, nextRealtime] = await Promise.all([
        apiGet<ReportsSummary>('/reports/summary'),
        apiGet<TimingHistory>('/timing/history'),
        apiGet<HardwareTelemetry>('/hardware/telemetry'),
        apiGet<DashboardRealtime>('/dashboard/realtime'),
      ]);

      if (!mounted) {
        return;
      }

      setSummary(nextSummary);
      setHistory(nextHistory);
      setHardware(nextHardware);
      setRealtime(nextRealtime);
    }

    void load();
    const socket = io(API_BASE, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => void load());
    socket.on('timing.state.updated', () => void load());
    socket.on('hardware.status.updated', () => void load());
    socket.on('run.completed', () => void load());

    const interval = window.setInterval(() => void load(), 2500);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      socket.close();
    };
  }, []);

  return (
    <div className="section-stack">
      <div className="dashboard-kpi-grid live">
        <div className="kpi-card">
          <div className="kpi-label">Events</div>
          <div className="kpi-value">{summary?.totalEvents ?? 0}</div>
          <div className="kpi-delta">Configured competition events</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Competitors</div>
          <div className="kpi-value">{summary?.totalCompetitors ?? 0}</div>
          <div className="kpi-delta">Entries in current data set</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Raw Messages</div>
          <div className="kpi-value">{hardware?.counters.rawMessages ?? 0}</div>
          <div className="kpi-delta">Realtime hardware feed volume</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">System Mode</div>
          <div className="kpi-value">{realtime?.readiness === 'ready' ? 'Ready' : 'Degraded'}</div>
          <div className="kpi-delta">
            {realtime?.readiness === 'simulated' ? 'Simulator mode' : realtime?.timing.state ?? 'Loading live state'}
          </div>
        </div>
      </div>

      <div className="dashboard-board">
        <section className="metric-card">
          <p className="eyebrow">Realtime Executive Report</p>
          <p className="panel-title">Operational posture, platform dependencies, and live delivery path</p>
          <div className="info-list">
            <div className="info-row"><span className="info-label">Event</span><span className="info-value">{realtime?.timing.eventName ?? '--'}</span></div>
            <div className="info-row"><span className="info-label">Class</span><span className="info-value">{realtime?.timing.className ?? '--'}</span></div>
            <div className="info-row"><span className="info-label">Hardware mode</span><span className="info-value">{hardware?.status.connected ? `${hardware.status.source === 'physical' ? 'ALGE' : 'Simulator'} ${hardware.status.mode}` : 'Offline'}</span></div>
            <div className="info-row"><span className="info-label">Parser rules</span><span className="info-value">{hardware?.status.parserRuleCount ?? 0}</span></div>
            <div className="info-row"><span className="info-label">Postgres</span><span className="info-value">{realtime?.persistence.postgres ? 'Online' : 'Offline'}</span></div>
            <div className="info-row"><span className="info-label">Redis</span><span className="info-value">{realtime?.persistence.redis ? 'Online' : 'Offline'}</span></div>
            <div className="info-row"><span className="info-label">vMix automation</span><span className="info-value">{realtime?.vmix.enabled ? 'Enabled' : 'Manual mode'}</span></div>
          </div>
        </section>

        <section className="metric-card">
          <p className="eyebrow">Reliability Signals</p>
          <p className="panel-title">Hardware history and runtime incident pressure</p>
          <div className="compact-table">
            {(hardware?.diagnostics ?? []).slice(0, 5).map((item) => (
              <div key={item.id} className="compact-row">
                <div className={`compact-status ${item.level === 'error' ? 'danger' : item.level === 'warn' ? 'warn' : ''}`}>{item.level}</div>
                <div>
                  <div className="compact-title">{item.message}</div>
                  <div className="compact-copy">{new Date(item.createdAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="dashboard-board">
        <section className="metric-card">
          <p className="eyebrow">Run Performance</p>
          <p className="panel-title">Completed rounds with timing and finish details</p>
          <div className="report-table">
            <div className="report-row report-head">
              <span>Competitor</span>
              <span>Elapsed</span>
              <span>Finish</span>
              <span>Override</span>
            </div>
            {history.slice(0, 8).map((run) => (
              <div key={run.id} className="report-row">
                <span>{run.competitor?.riderName ?? 'Unknown'} / {run.competitor?.horseName ?? 'Unknown horse'}</span>
                <span>{formatElapsed(run.elapsedMs)}</span>
                <span>{run.finishReason ?? run.state}</span>
                <span>{run.manualOverrideUsed ? 'Yes' : 'No'}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="metric-card">
          <p className="eyebrow">Hardware Feed</p>
          <p className="panel-title">Latest payloads received through the timing input path</p>
          <div className="report-table">
            <div className="report-row report-head">
              <span>Payload</span>
              <span>Type</span>
              <span>Channel</span>
              <span>Received</span>
            </div>
            {(hardware?.logs ?? []).slice(0, 8).map((log, index) => (
              <div key={`${log.receivedAt}-${index}`} className="report-row">
                <span>{log.payload}</span>
                <span>{log.parsed?.type ?? 'UNKNOWN'}</span>
                <span>{log.parsed?.channel ?? '--'}</span>
                <span>{new Date(log.receivedAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
