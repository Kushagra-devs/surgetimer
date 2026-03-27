'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { apiGet, apiPost } from '../lib/api';
import { formatDisplayTimer, getTimerLabel } from '../lib/timer-state';

type TimingStateResponse = {
  snapshot: {
    state: string;
    context: {
      warmupStartedAt?: string | null;
      mainStartedAt?: string | null;
      mainEndsAt?: string | null;
      completedAt?: string | null;
      pausedAt?: string | null;
      lastSensorMessage: { channel: string; rawPayload: string; at: string } | null;
      warnings: string[];
    };
  };
  elapsedMs: number;
  competitor: {
    id: string;
    riderName: string;
    horseName: string;
    bibNumber: string;
    startOrder: number;
  } | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export function JudgePanel() {
  const [state, setState] = useState<TimingStateResponse | null>(null);
  const [hardwareStatus, setHardwareStatus] = useState<{ connected: boolean; mode: string; source: 'simulated' | 'physical' } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    void apiGet<TimingStateResponse>('/timing/state').then(setState);
    void apiGet<{ connected: boolean; mode: string; source: 'simulated' | 'physical' }>('/hardware/status').then(setHardwareStatus);

    const socket = io(API_BASE);
    socket.on('timing.state.updated', (message: { payload: TimingStateResponse }) => {
      setState(message.payload);
    });
    socket.on('hardware.status.updated', (message: { payload: { status: { connected: boolean; mode: string; source: 'simulated' | 'physical' } } }) => {
      setHardwareStatus(message.payload.status);
    });

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(interval);
  }, []);

  const timer = formatDisplayTimer(state?.snapshot ?? null, state?.elapsedMs ?? 0, now);
  const warning = state?.snapshot.context.warnings?.at(-1);

  async function fire(path: string, body?: unknown) {
    try {
      setActionError('');
      const result = await apiPost<TimingStateResponse>(path, body);
      setState(result);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Action failed.');
    }
  }

  async function advanceQueue() {
    try {
      setActionError('');
      const result = await apiPost<TimingStateResponse>('/classes/class-demo/queue/advance');
      setState(result);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Queue advance failed.');
    }
  }

  const hardwareLabel = hardwareStatus
    ? hardwareStatus.connected
      ? hardwareStatus.source === 'physical'
        ? `ALGE ${hardwareStatus.mode} connected`
        : 'Simulator connected'
      : hardwareStatus.source === 'physical'
        ? `ALGE ${hardwareStatus.mode} offline`
        : 'Simulator idle'
    : 'Hardware status unknown';

  return (
    <div className="judge-grid">
      <div className="judge-left">
        <div className="metric-card">
          <div className="split-row" style={{ marginBottom: 18 }}>
            <div>
              <p className="eyebrow">Live Ring Control</p>
              <p className="panel-title" style={{ marginBottom: 0 }}>Primary Judge Surface</p>
            </div>
            <div className="status-pill">
              <span className={`status-dot ${hardwareStatus?.connected ? '' : 'offline'}`} />
              {hardwareLabel}
            </div>
          </div>
          <div className="timer-display">{timer}</div>
          <div className="split-row" style={{ marginTop: 18, flexWrap: 'wrap' }}>
            <div>
              <p className="eyebrow">{getTimerLabel(state?.snapshot.state)}</p>
              <div style={{ fontSize: '2rem', fontFamily: 'var(--display-font)', color: 'var(--ink)' }}>
                {state?.snapshot.state ?? 'IDLE'}
              </div>
            </div>
            <div>
              <p className="eyebrow">Realtime Feed</p>
              <div style={{ color: 'var(--text-muted)' }}>{hardwareStatus ? `${hardwareStatus.source} · ${hardwareStatus.mode}` : 'unknown adapter'}</div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="split-row" style={{ alignItems: 'flex-start' }}>
            <div>
              <p className="eyebrow">Active Competitor</p>
              <p className="panel-title" style={{ fontSize: '2rem', marginBottom: 6 }}>
                {state?.competitor?.riderName ?? 'Awaiting arm'}
              </p>
              <p className="muted" style={{ marginTop: 0, marginBottom: 0 }}>
                {state?.competitor?.horseName ?? 'No horse selected'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="eyebrow">Bib</p>
              <div style={{ fontSize: '2.25rem', fontFamily: 'var(--display-font)', color: 'var(--ink)' }}>
                {state?.competitor?.bibNumber ?? '--'}
              </div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <p className="eyebrow">Judge Actions</p>
          <p className="panel-title">Fast-access overrides and timer controls</p>
          <div className="button-grid">
            <button
              className="action-button accent"
              onClick={() => void fire(`/timing/arm/${state?.competitor?.id ?? 'entry-1'}`)}
            >
              Arm Competitor
            </button>
            <button className="action-button" onClick={() => fire('/timing/manual/warmup-start')}>
              Start Warm-up
            </button>
            <button className="action-button" onClick={() => fire('/timing/manual/main-start')}>
              Start Main
            </button>
            <button className="action-button" onClick={() => fire('/timing/pause')}>
              Pause
            </button>
            <button className="action-button" onClick={() => fire('/timing/resume')}>
              Resume
            </button>
            <button className="action-button" onClick={() => fire('/timing/manual/stop')}>
              Stop
            </button>
            <button className="action-button danger" onClick={() => fire('/timing/abort', { reason: 'Judge intervention' })}>
              Abort
            </button>
            <button className="action-button" onClick={() => fire('/timing/reset')}>
              Reset
            </button>
            <button className="action-button" onClick={() => void advanceQueue()}>
              Next Competitor
            </button>
          </div>
        </div>

        {warning ? <div className="warning-banner">{warning}</div> : null}
        {actionError ? <div className="warning-banner">{actionError}</div> : null}
      </div>

      <div className="judge-right">
        <div className="metric-card">
          <p className="eyebrow">Signal Monitor</p>
          <p className="panel-title">Last received sensor message</p>
          <div className="info-list">
            <div className="info-row">
              <span className="info-label">Channel</span>
              <span className="info-value">{state?.snapshot.context.lastSensorMessage?.channel ?? 'Awaiting signal'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Payload</span>
              <span className="info-value">{state?.snapshot.context.lastSensorMessage?.rawPayload ?? 'No payload yet'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Received</span>
              <span className="info-value">{state?.snapshot.context.lastSensorMessage?.at ?? '--'}</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <p className="eyebrow">Queue Preview</p>
          <p className="panel-title">Up next in ring</p>
          <div className="info-list">
            <div className="info-row">
              <span className="info-label">Current order</span>
              <span className="info-value">#{state?.competitor?.startOrder ?? '--'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Rider</span>
              <span className="info-value">{state?.competitor?.riderName ?? 'Awaiting selection'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Horse</span>
              <span className="info-value">{state?.competitor?.horseName ?? 'Awaiting selection'}</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <p className="eyebrow">Operations Note</p>
          <p className="panel-title">Live timing guidance</p>
          <p className="muted" style={{ margin: 0 }}>
            This panel is now the primary live timing surface. The timer display keeps moving from backend timestamps, so operators can trust what they see between signals.
          </p>
        </div>
      </div>
    </div>
  );
}
