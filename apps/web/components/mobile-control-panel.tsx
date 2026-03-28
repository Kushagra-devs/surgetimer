'use client';

import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { apiGet, apiPost } from '../lib/api';
import { DEFAULT_PUBLIC_API_BASE_URL } from '../lib/runtime-config';
import { formatDisplayTimer, getTimerLabel } from '../lib/timer-state';
import type { MobileControlLocation, MobileControlStatus } from '@horse-timer/types';

const API_BASE = DEFAULT_PUBLIC_API_BASE_URL;

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

type MobileLoginResponse = {
  ok: boolean;
  expiresAt: string | null;
  sessionToken: string;
  status: MobileControlStatus;
};

export function MobileControlPanel({ initialCode }: { initialCode?: string }) {
  const [accessCode, setAccessCode] = useState(initialCode ?? '');
  const [accessPassword, setAccessPassword] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [accessMessage, setAccessMessage] = useState('Enter the generated mobile control code to unlock timer actions.');
  const [locationMessage, setLocationMessage] = useState('Location permission is required for mobile control.');
  const [state, setState] = useState<TimingStateResponse | null>(null);
  const [hardwareStatus, setHardwareStatus] = useState<HardwareStatus | null>(null);
  const [realtime, setRealtime] = useState<RealtimeStatus | null>(null);
  const [mobileStatus, setMobileStatus] = useState<MobileControlStatus | null>(null);
  const [sessionToken, setSessionToken] = useState('');
  const [location, setLocation] = useState<MobileControlLocation | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!unlocked) {
        return;
      }
      const [timing, hardware, dashboard, mobile] = await Promise.all([
        apiGet<TimingStateResponse>('/timing/state'),
        apiGet<HardwareStatus>('/hardware/status'),
        apiGet<RealtimeStatus>('/dashboard/realtime'),
        apiGet<MobileControlStatus>('/mobile-access/status'),
      ]);

      if (!mounted) {
        return;
      }

      setState(timing);
      setHardwareStatus(hardware);
      setRealtime(dashboard);
      setMobileStatus(mobile);
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
    let mounted = true;

    void apiGet<MobileControlStatus>('/mobile-access/status').then((status) => {
      if (mounted) {
        setMobileStatus(status);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!unlocked || !sessionToken) {
      return;
    }

    const interval = window.setInterval(() => {
      void apiPost<{ status: MobileControlStatus }>('/mobile-access/heartbeat', {
        sessionToken,
        location,
      })
        .then((result) => {
          setMobileStatus(result.status);
        })
        .catch((error) => {
          setUnlocked(false);
          setSessionToken('');
          setAccessMessage(error instanceof Error ? error.message : 'Mobile session ended.');
        });
    }, 20000);

    return () => window.clearInterval(interval);
  }, [location, sessionToken, unlocked]);

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
    const pathMap: Record<string, string> = {
      '/timing/manual/warmup-start': 'warmup',
      '/timing/manual/main-start': 'main',
      '/timing/pause': 'pause',
      '/timing/resume': 'resume',
      '/timing/manual/stop': 'stop',
      '/timing/reset': 'reset',
      '/timing/abort': 'abort',
    };

    const action = path.startsWith('/timing/arm/')
      ? 'arm'
      : pathMap[path];

    try {
      const result = await apiPost<TimingStateResponse>('/mobile-access/action', {
        sessionToken,
        action,
        competitorEntryId: path.startsWith('/timing/arm/') ? path.split('/').at(-1) : undefined,
        ...(body as Record<string, unknown> | undefined),
      });
      setState(result);
    } catch (error) {
      setAccessMessage(error instanceof Error ? error.message : 'Mobile action failed.');
    }
  }

  useEffect(() => {
    if (initialCode) {
      setAccessCode(initialCode.toUpperCase());
    }
  }, [initialCode]);

  async function captureLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationMessage('Geolocation is not available on this device.');
      return;
    }

    setLocationMessage('Checking live location...');
    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracyMeters: position.coords.accuracy,
            capturedAt: new Date().toISOString(),
          });
          setLocationMessage(`Location captured with ${Math.round(position.coords.accuracy)}m accuracy.`);
          resolve();
        },
        (error) => {
          setLocation(null);
          setLocationMessage(error.message || 'Unable to capture location.');
          resolve();
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        },
      );
    });
  }

  async function unlockMobileControl(codeOverride?: string) {
    const code = (codeOverride ?? accessCode).trim().toUpperCase();
    if (!location) {
      setAccessMessage('Capture live location before unlocking mobile control.');
      return;
    }

    try {
      const result = await apiPost<MobileLoginResponse>('/mobile-access/login', {
        code,
        password: accessPassword,
        name: operatorName,
        location,
        device: {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
          language: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
          viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
        },
      });

      setAccessCode(code);
      setUnlocked(true);
      setSessionToken(result.sessionToken);
      setMobileStatus(result.status);
      setAccessMessage('Mobile control unlocked. This device is now registered as an active operator.');
    } catch (error) {
      setUnlocked(false);
      setSessionToken('');
      setAccessMessage(error instanceof Error ? error.message : 'Mobile control unlock failed.');
    }
  }

  if (!unlocked) {
    return (
      <main className="mobile-control-shell">
        <section className="mobile-control-card">
          <p className="eyebrow">Protected Mobile Control</p>
          <h1 className="mobile-control-title" style={{ fontSize: 'clamp(2rem, 8vw, 4rem)' }}>Access Required</h1>
          <p className="mobile-control-subtitle">Enter your name, the control password, and verify live location inside Surge Stable campus.</p>
          <label className="field-stack" style={{ marginTop: 18 }}>
            <span className="info-label">Operator Name</span>
            <input
              className="field-input"
              value={operatorName}
              onChange={(event) => setOperatorName(event.target.value)}
              placeholder="Enter your full name"
            />
          </label>
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
          <label className="field-stack" style={{ marginTop: 18 }}>
            <span className="info-label">Mobile Control Password</span>
            <input
              className="field-input"
              type="password"
              value={accessPassword}
              onChange={(event) => setAccessPassword(event.target.value)}
              placeholder="Enter mobile password"
            />
          </label>
          <div className="status-actions" style={{ marginTop: 16 }}>
            <button className="button-secondary" onClick={() => void captureLocation()}>
              Capture Campus Location
            </button>
            <button className="button-primary" onClick={() => void unlockMobileControl()}>
              Unlock Mobile Control
            </button>
          </div>
          <div className="inline-alert" style={{ marginTop: 16 }}>{locationMessage}</div>
          <div className="inline-alert" style={{ marginTop: 16 }}>{accessMessage}</div>
          {mobileStatus ? (
            <div className="info-list" style={{ marginTop: 16 }}>
              <div className="info-row"><span className="info-label">Allowed operators</span><span className="info-value">{mobileStatus.activeUsers} / {mobileStatus.campus.maxConcurrentUsers}</span></div>
              <div className="info-row"><span className="info-label">Campus</span><span className="info-value">{mobileStatus.campus.address}</span></div>
            </div>
          ) : null}
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
          <span className={`status-chip ${mobileStatus && mobileStatus.activeUsers <= mobileStatus.campus.maxConcurrentUsers ? 'ok' : 'warn'}`}>
            {mobileStatus ? `${mobileStatus.activeUsers}/${mobileStatus.campus.maxConcurrentUsers} operators` : 'Operators --'}
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
          <button className="action-button accent" onClick={() => fire(`/timing/arm/${state?.competitor?.id ?? 'entry-1'}`)}>Arm</button>
          <button className="action-button" onClick={() => fire('/timing/manual/warmup-start')}>Warm-up</button>
          <button className="action-button" onClick={() => fire('/timing/manual/main-start')}>Main</button>
          <button className="action-button" onClick={() => fire('/timing/pause')}>Pause</button>
          <button className="action-button" onClick={() => fire('/timing/resume')}>Resume</button>
          <button className="action-button" onClick={() => fire('/timing/manual/stop')}>Stop</button>
          <button className="action-button danger" onClick={() => fire('/timing/abort', { reason: 'Mobile control abort' })}>Abort</button>
          <button className="action-button" onClick={() => fire('/timing/reset')}>Reset</button>
        </div>

        <div className="info-list" style={{ marginTop: 16 }}>
          <div className="info-row"><span className="info-label">Operator</span><span className="info-value">{operatorName || '--'}</span></div>
          <div className="info-row"><span className="info-label">Campus distance</span><span className="info-value">{mobileStatus?.sessions[0] ? `${Math.round(mobileStatus.sessions[0].distanceMeters)}m` : '--'}</span></div>
          <div className="info-row"><span className="info-label">Last sensor</span><span className="info-value">{state?.snapshot.context.lastSensorMessage?.channel ?? '--'}</span></div>
          <div className="info-row"><span className="info-label">Payload</span><span className="info-value">{state?.snapshot.context.lastSensorMessage?.rawPayload ?? '--'}</span></div>
          <div className="info-row"><span className="info-label">Warnings</span><span className="info-value">{state?.snapshot.context.warnings.at(-1) ?? 'None'}</span></div>
        </div>

        {mobileStatus?.sessions?.length ? (
          <div className="info-list" style={{ marginTop: 16 }}>
            {mobileStatus.sessions.map((session) => (
              <div key={session.id} className="info-row">
                <span className="info-label">{session.name}</span>
                <span className="info-value">{session.device.platform} · {Math.round(session.distanceMeters)}m · {new Date(session.lastSeenAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}
