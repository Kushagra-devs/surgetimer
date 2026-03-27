'use client';

import { useEffect, useState } from 'react';
import { PageFrame } from '../../components/page-frame';
import { apiGet, apiPost } from '../../lib/api';

type RunHistoryEntry = {
  id: string;
  competitor?: {
    riderName?: string;
    horseName?: string;
    bibNumber?: string;
  } | null;
  state: string;
  elapsedMs: number;
  penalties?: number;
  resultCode?: string;
  notes?: string;
  armedAt?: string | null;
  warmupStartedAt?: string | null;
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
    reason?: string | null;
  }>;
};

type ActiveRunHistory = {
  snapshot?: {
    state: string;
    context?: {
      armedAt?: string | null;
      warmupStartedAt?: string | null;
      mainStartedAt?: string | null;
      completedAt?: string | null;
    };
  };
  elapsedMs: number;
  competitor?: {
    riderName?: string;
    horseName?: string;
    bibNumber?: string;
  } | null;
  eventTrail: Array<{
    id: string;
    at: string;
    eventType: string;
    previousState: string;
    nextState: string;
    accepted: boolean;
    reason?: string | null;
  }>;
};

export default function RunLogsPage() {
  const [runs, setRuns] = useState<RunHistoryEntry[]>([]);
  const [activeRun, setActiveRun] = useState<ActiveRunHistory | null>(null);
  const [savingRunId, setSavingRunId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const [history, live] = await Promise.all([
        apiGet<RunHistoryEntry[]>('/timing/history'),
        apiGet<ActiveRunHistory>('/timing/history/live'),
      ]);

      if (!mounted) {
        return;
      }

      setRuns(history);
      setActiveRun(live);
    }

    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 1500);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <PageFrame title="Run Logs" description="Completed runs with exact transition timestamps and event trails.">
      <div className="section-stack">
        <div className="metric-card">
          <div className="split-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div>
              <p className="eyebrow">Live Run Timeline</p>
              <p className="panel-title" style={{ marginBottom: 8 }}>
                {activeRun?.competitor?.riderName ?? 'No active competitor'} / {activeRun?.competitor?.horseName ?? 'Waiting for arm'}
              </p>
            </div>
            <span className="status-pill">{((activeRun?.elapsedMs ?? 0) / 1000).toFixed(2)}s</span>
          </div>
          <div className="section-grid" style={{ marginTop: 16 }}>
            <div className="info-list">
              <div className="info-row"><span className="info-label">State</span><span className="info-value">{activeRun?.snapshot?.state ?? 'IDLE'}</span></div>
              <div className="info-row"><span className="info-label">Bib</span><span className="info-value">{activeRun?.competitor?.bibNumber ?? '--'}</span></div>
            </div>
            <div className="info-list">
              <div className="info-row"><span className="info-label">Armed</span><span className="info-value">{formatDate(activeRun?.snapshot?.context?.armedAt)}</span></div>
              <div className="info-row"><span className="info-label">Warm-up Start</span><span className="info-value">{formatDate(activeRun?.snapshot?.context?.warmupStartedAt)}</span></div>
              <div className="info-row"><span className="info-label">Main Start</span><span className="info-value">{formatDate(activeRun?.snapshot?.context?.mainStartedAt)}</span></div>
            </div>
          </div>
          <div className="table-shell" style={{ marginTop: 18 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Event</th>
                  <th>State Change</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeRun?.eventTrail?.length ? activeRun.eventTrail.map((event) => (
                  <tr key={event.id}>
                    <td>{formatDate(event.at)}</td>
                    <td>{event.eventType}</td>
                    <td>{`${event.previousState} -> ${event.nextState}`}</td>
                    <td>{event.accepted ? 'Accepted' : event.reason ?? 'Ignored'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4}>No live timing events yet. Arm a competitor to start the trail.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {runs.length === 0 ? (
          <div className="metric-card">No completed runs yet. Once a round finishes, the full run timeline will appear here.</div>
        ) : null}
        {runs.map((run) => (
          <div key={run.id} className="metric-card">
            <div className="split-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <p className="eyebrow">Run {run.competitor?.bibNumber ?? '--'}</p>
                <p className="panel-title" style={{ marginBottom: 8 }}>
                  {run.competitor?.riderName ?? 'Unknown Rider'} / {run.competitor?.horseName ?? 'Unknown Horse'}
                </p>
              </div>
              <span className="status-pill">{(run.elapsedMs / 1000).toFixed(2)}s</span>
            </div>
            <div className="section-grid" style={{ marginTop: 16 }}>
              <div className="info-list">
                <div className="info-row"><span className="info-label">Armed</span><span className="info-value">{formatDate(run.armedAt)}</span></div>
                <div className="info-row"><span className="info-label">Warm-up Start</span><span className="info-value">{formatDate(run.warmupStartedAt)}</span></div>
                <div className="info-row"><span className="info-label">Main Start</span><span className="info-value">{formatDate(run.mainStartedAt)}</span></div>
                <div className="info-row"><span className="info-label">Main End</span><span className="info-value">{formatDate(run.mainEndedAt)}</span></div>
              </div>
              <div className="info-list">
                <div className="info-row"><span className="info-label">Final State</span><span className="info-value">{run.state}</span></div>
                <div className="info-row"><span className="info-label">Finish Reason</span><span className="info-value">{run.finishReason ?? '--'}</span></div>
                <div className="info-row"><span className="info-label">Penalties</span><span className="info-value">{run.penalties ?? 0}</span></div>
                <div className="info-row"><span className="info-label">Result Code</span><span className="info-value">{run.resultCode ?? '--'}</span></div>
                <div className="info-row"><span className="info-label">Manual Override</span><span className="info-value">{run.manualOverrideUsed ? 'Yes' : 'No'}</span></div>
                <div className="info-row"><span className="info-label">Events</span><span className="info-value">{run.eventTrail?.length ?? 0}</span></div>
              </div>
            </div>
            <RunResultEditor
              run={run}
              saving={savingRunId === run.id}
              onSave={async (body) => {
                setSavingRunId(run.id);
                try {
                  const updated = await apiPost<RunHistoryEntry>(`/timing/history/${run.id}/result`, body);
                  setRuns((current) => current.map((item) => (item.id === run.id ? updated : item)));
                } finally {
                  setSavingRunId(null);
                }
              }}
            />
            <div className="table-shell" style={{ marginTop: 18 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Event</th>
                    <th>State Change</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(run.eventTrail ?? []).map((event) => (
                    <tr key={event.id}>
                      <td>{formatDate(event.at)}</td>
                      <td>{event.eventType}</td>
                      <td>{`${event.previousState} -> ${event.nextState}`}</td>
                      <td>{event.accepted ? 'Accepted' : event.reason ?? 'Ignored'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </PageFrame>
  );
}

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : '--';
}

function RunResultEditor({
  run,
  saving,
  onSave,
}: {
  run: RunHistoryEntry;
  saving: boolean;
  onSave: (body: { penalties: number; resultCode: string; notes: string }) => Promise<void>;
}) {
  const [penalties, setPenalties] = useState(String(run.penalties ?? 0));
  const [resultCode, setResultCode] = useState(run.resultCode ?? 'FINISHED');
  const [notes, setNotes] = useState(run.notes ?? '');

  useEffect(() => {
    setPenalties(String(run.penalties ?? 0));
    setResultCode(run.resultCode ?? 'FINISHED');
    setNotes(run.notes ?? '');
  }, [run.id, run.notes, run.penalties, run.resultCode]);

  return (
    <div className="metric-card surface-soft" style={{ marginTop: 18 }}>
      <p className="eyebrow">Results Workflow</p>
      <p className="panel-title">Penalties, result code, and official notes</p>
      <div className="section-grid" style={{ marginTop: 12 }}>
        <label className="field-stack">
          <span className="info-label">Penalties</span>
          <input className="field-input" value={penalties} onChange={(event) => setPenalties(event.target.value)} />
        </label>
        <label className="field-stack">
          <span className="info-label">Result Code</span>
          <select className="field-input" value={resultCode} onChange={(event) => setResultCode(event.target.value)}>
            <option value="FINISHED">FINISHED</option>
            <option value="ELIMINATED">ELIMINATED</option>
            <option value="RETIRED">RETIRED</option>
            <option value="ABORTED">ABORTED</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
          </select>
        </label>
      </div>
      <label className="field-stack" style={{ marginTop: 12 }}>
        <span className="info-label">Official Notes</span>
        <textarea className="field-input" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>
      <div className="status-actions" style={{ marginTop: 12 }}>
        <button
          className="button-primary"
          disabled={saving}
          onClick={() => void onSave({ penalties: Number(penalties) || 0, resultCode, notes })}
        >
          {saving ? 'Saving...' : 'Save Result'}
        </button>
      </div>
    </div>
  );
}
