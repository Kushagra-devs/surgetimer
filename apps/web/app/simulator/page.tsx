'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { PageFrame } from '../../components/page-frame';
import { apiGet, apiPost } from '../../lib/api';
import { formatDisplayTimer, getTimerLabel } from '../../lib/timer-state';

type Competitor = {
  id: string;
  riderName: string;
  horseName: string;
  bibNumber: string;
  status: string;
};

type TimingState = {
  snapshot: {
    state: string;
    context: {
      competitorId?: string | null;
      warmupStartedAt?: string | null;
      mainStartedAt?: string | null;
      mainEndsAt?: string | null;
      completedAt?: string | null;
    };
  };
  elapsedMs: number;
  competitor?: Competitor | null;
};

export default function SimulatorPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string>('');
  const [state, setState] = useState<TimingState | null>(null);
  const [now, setNow] = useState(() => Date.now());

  async function load() {
    const [competitorData, timingState] = await Promise.all([
      apiGet<Competitor[]>('/competitors'),
      apiGet<TimingState>('/timing/state'),
    ]);
    setCompetitors(competitorData);
    setState(timingState);
    setSelectedCompetitorId((current) => current || competitorData[0]?.id || '');
  }

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(interval);
  }, []);

  const timer = useMemo(() => formatDisplayTimer(state?.snapshot ?? null, state?.elapsedMs ?? 0, now), [state, now]);

  async function armSelected() {
    if (!selectedCompetitorId) {
      return;
    }
    await apiPost(`/timing/arm/${selectedCompetitorId}`);
    await load();
  }

  async function inject(channel: string, payload: string) {
    await apiPost('/hardware/test-signal', { channel, payload });
    await load();
  }

  return (
    <PageFrame
      title="Hardware Simulator"
      description="Drive the same server-authoritative timing path used by ALGE hardware. This simulator now works even when the app is configured for serial or TCP adapters."
    >
      <div className="section-grid">
        <div className="metric-card">
          <p className="eyebrow">Live Timing State</p>
          <p className="panel-title">Current server state</p>
          <div className="timer-display">{timer}</div>
          <div className="info-list" style={{ marginTop: 18 }}>
            <div className="info-row">
              <span className="info-label">Label</span>
              <span className="info-value">{getTimerLabel(state?.snapshot.state)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">State</span>
              <span className="info-value">{state?.snapshot.state ?? 'IDLE'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Competitor</span>
              <span className="info-value">{state?.competitor?.riderName ?? 'Awaiting competitor'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Horse</span>
              <span className="info-value">{state?.competitor?.horseName ?? '--'}</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <p className="eyebrow">Arm Competitor</p>
          <p className="panel-title">Choose the active entry before injecting signals</p>
          <div className="info-list">
            <select value={selectedCompetitorId} onChange={(event) => setSelectedCompetitorId(event.target.value)} style={inputStyle}>
              {competitors.map((competitor) => (
                <option key={competitor.id} value={competitor.id}>
                  {competitor.bibNumber} · {competitor.riderName} / {competitor.horseName}
                </option>
              ))}
            </select>
            <button className="action-button accent" onClick={() => void armSelected()}>
              Arm Selected Competitor
            </button>
          </div>
        </div>
      </div>

      <div className="metric-card">
        <p className="eyebrow">Signal Injection</p>
        <p className="panel-title">Simulator commands</p>
        <p className="muted">These signals go through the hardware parser path, then into the same timing engine used by live ALGE input.</p>
        <div className="button-grid" style={{ marginTop: 16 }}>
          <button className="action-button accent" onClick={() => void inject('C0', 'TRIG')}>
            Trigger Warm-up
          </button>
          <button className="action-button" onClick={() => void inject('C1', 'TRIG')}>
            Trigger Main
          </button>
          <button className="action-button" onClick={() => void inject('C2', 'FINISH')}>
            Trigger Finish
          </button>
          <button className="action-button" onClick={() => void apiPost('/timing/manual/stop').then(load)}>
            Manual Stop
          </button>
          <button className="action-button" onClick={() => void apiPost('/timing/reset').then(load)}>
            Reset State
          </button>
        </div>
      </div>
    </PageFrame>
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
