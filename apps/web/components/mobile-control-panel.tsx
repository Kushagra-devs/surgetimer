'use client';

import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { apiGet, apiPost } from '../lib/api';
import { formatDisplayTimer, getTimerLabel } from '../lib/timer-state';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

type TimingStateResponse = {
  snapshot: {
    state: string;
    context: {
      warmupStartedAt?: string | null;
      mainStartedAt?: string | null;
      mainEndsAt?: string | null;
      completedAt?: string | null;
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

type HardwareStatus = {
  connected: boolean;
  mode: string;
  source: 'simulated' | 'physical';
};

type RealtimeStatus = {
  readiness: 'ready' | 'degraded' | 'simulated';
  goLive: {
    allowed: boolean;
    blockers: string[];
  };
};

export function MobileControlPanel({ initialCode }: { initialCode?: string }) {
  const [accessCode, setAccessCode] = useState(initialCode ?? '');
  const [unlocked, setUnlocked] = useState(false);
  const [accessMessage, setAccessMessage] = useState('Enter the generated mobile control code to unlock timer actions.');
  const [state, setState] = useState<TimingStateResponse | null>(null);
  const [hardwareStatus, setHardwareStatus] = useState<HardwareStatus | null>(null);
  const [realtime, setRealtime] = useState<RealtimeStatus | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!unlocked) {
        return;
      }
      const [timing, hardware, dashboard] = await Promise.all([
        apiGet<TimingStateResponse>('/timing/state'),
        apiGet<HardwareStatus>('/hardware/status'),
        apiGet<RealtimeStatus>('/dashboard/realtime'),
      ]);

      if (!mounted) {
        return;
      }

      setState(timing);
      setHardwareStatus(hardware);
      setRealtime(dashboard);
    }

    void load();
    const socket = io(API_BASE, { transports: ['websocket', 'polling'] });
    socket.on('timing.state.updated', (message: { payload: TimingStateResponse }) => {
      if (unlocked) {
        setState(message.payload);
      }
    });
    socket.on('hardware.status.updated', (message: { payload: { status: HardwareStatus } }) => {
      if (unlocked) {
        setHardwareStatus(message.payload.status);
      }
    });
    socket.on('overlay.updated', () => void load());
    socket.on('run.completed', () => void load());

    const interval = window.setInterval(() => void load(), 2000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      socket.close();
    };
  }, [unlocked]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(interval);
  }, []);

  const timer = formatDisplayTimer(state?.snapshot ?? null, state?.elapsedMs ?? 0, now);
  const statusTone = useMemo(() => {
    if (realtime?.readiness === 'ready') {
      return 'ok';
    }
    if (realtime?.readiness === 'simulated') {
      return 'warn';
    }
    return 'danger';
  }, [realtime?.readiness]);

  async function fire(path: string, body?: unknown) {
    const result = await apiPost<TimingStateResponse>(path, body);
    setState(result);
  }

  useEffect(() => {
    if (initialCode) {
      void unlockMobileControl(initialCode);
    }
  }, [initialCode]);

  async function unlockMobileControl(codeOverride?: string) {
    const code = (codeOverride ?? accessCode).trim().toUpperCase();
    const result = await apiPost<{ ok: boolean; reason?: string }>('/mobile-access/validate', {
      code,
    });

    if (!result.ok) {
      setUnlocked(false);
      setAccessMessage(result.reason ?? 'Access denied.');
      return;
    }

    setAccessCode(code);
    setUnlocked(true);
    setAccessMessage('Mobile control unlocked. This code is valid until it expires or a new code is generated.');
  }

  if (!unlocked) {
    return (
      <main className="mobile-control-shell">
        <section className="mobile-control-card">
          <p className="eyebrow">Protected Mobile Control</p>
          <h1 className="mobile-control-title" style={{ fontSize: 'clamp(2rem, 8vw, 4rem)' }}>Access Required</h1>
          <p className="mobile-control-subtitle">This page is protected by a rotating mobile access code.</p>
          <label className="field-stack" style={{ marginTop: 18 }}>
            <span className="info-label">Mobile Access Code</span>
            <input
              className="field-input"
              type="password"
              value={accessCode}
              onChange={(event) => setAccessCode(event.target.value.toUpperCase())}
              placeholder="Enter generated code"
            />
          </label>
          <div className="status-actions" style={{ marginTop: 16 }}>
            <button className="button-primary" onClick={() => void unlockMobileControl()}>
              Unlock Mobile Control
            </button>
          </div>
          <div className="inline-alert" style={{ marginTop: 16 }}>{accessMessage}</div>
        </section>
      </main>
    );
  }

  return (
    <main className="mobile-control-shell">
      <section className="mobile-control-card">
        <div className="status-chip-row">
          <span className={`status-chip ${statusTone}`}>
            {realtime?.readiness === 'ready' ? 'LAN Live' : realtime?.readiness === 'simulated' ? 'Simulator' : 'Degraded'}
          </span>
          <span className={`status-chip ${hardwareStatus?.connected ? 'ok' : 'warn'}`}>
            {hardwareStatus?.connected
              ? hardwareStatus.source === 'physical'
                ? `ALGE ${hardwareStatus.mode}`
                : 'Simulator'
              : 'Hardware Offline'}
          </span>
        </div>

        <p className="eyebrow">Mobile Control</p>
        <h1 className="mobile-control-title">{timer}</h1>
        <p className="mobile-control-subtitle">{state?.snapshot.state ? getTimerLabel(state.snapshot.state) : 'Awaiting state'}</p>

        <div className="mobile-control-identity">
          <strong>{state?.competitor?.riderName ?? 'Awaiting rider'}</strong>
          <span>{state?.competitor?.horseName ?? 'Awaiting horse'} · #{state?.competitor?.bibNumber ?? '--'}</span>
        </div>

        {!realtime?.goLive.allowed && realtime?.goLive.blockers?.length ? (
          <div className="inline-alert danger">{realtime.goLive.blockers[0]}</div>
        ) : null}

        <div className="mobile-control-grid">
          <button className="action-button accent" onClick={() => fire('/timing/arm/entry-1')}>Arm</button>
          <button className="action-button" onClick={() => fire('/timing/manual/warmup-start')}>Warm-up</button>
          <button className="action-button" onClick={() => fire('/timing/manual/main-start')}>Main</button>
          <button className="action-button" onClick={() => fire('/timing/pause')}>Pause</button>
          <button className="action-button" onClick={() => fire('/timing/resume')}>Resume</button>
          <button className="action-button" onClick={() => fire('/timing/manual/stop')}>Stop</button>
          <button className="action-button danger" onClick={() => fire('/timing/abort', { reason: 'Mobile control abort' })}>Abort</button>
          <button className="action-button" onClick={() => fire('/timing/reset')}>Reset</button>
        </div>

        <div className="info-list" style={{ marginTop: 16 }}>
          <div className="info-row"><span className="info-label">Last sensor</span><span className="info-value">{state?.snapshot.context.lastSensorMessage?.channel ?? '--'}</span></div>
          <div className="info-row"><span className="info-label">Payload</span><span className="info-value">{state?.snapshot.context.lastSensorMessage?.rawPayload ?? '--'}</span></div>
          <div className="info-row"><span className="info-label">Warnings</span><span className="info-value">{state?.snapshot.context.warnings.at(-1) ?? 'None'}</span></div>
        </div>
      </section>
    </main>
  );
}
