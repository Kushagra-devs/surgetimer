'use client';

import { useEffect, useState } from 'react';
import type { PreEventCheckReport } from '@horse-timer/types';
import { apiGet, apiPost } from '../../lib/api';

function statusLabel(status: PreEventCheckReport['overallStatus'] | PreEventCheckReport['checks'][number]['status']) {
  switch (status) {
    case 'pass':
      return 'Pass';
    case 'warn':
      return 'Warn';
    default:
      return 'Fail';
  }
}

export function PreEventCheckConsole() {
  const [report, setReport] = useState<PreEventCheckReport | null>(null);
  const [running, setRunning] = useState(false);

  async function load() {
    setReport(await apiGet<PreEventCheckReport>('/system/preflight-checks'));
  }

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 3000);
    return () => window.clearInterval(interval);
  }, []);

  async function rerun() {
    setRunning(true);
    try {
      await apiPost('/system/clear-cache', {});
      await load();
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="section-stack">
      <div className="metric-card">
        <p className="eyebrow">Pre-Event Test Connection</p>
        <p className="panel-title">Step-by-step live readiness checks before opening the event</p>
        <div className="split-row" style={{ flexWrap: 'wrap', marginTop: 18 }}>
          <div className={`incident-strip ${report?.overallStatus === 'pass' ? 'ok' : report?.overallStatus === 'warn' ? 'warn' : 'critical'}`} style={{ margin: 0 }}>
            {report ? `${statusLabel(report.overallStatus)} · ${report.summary}` : 'Loading pre-event checks...'}
          </div>
          <button className="action-button accent" onClick={() => void rerun()} disabled={running}>
            {running ? 'Running Checks...' : 'Run Checks Again'}
          </button>
        </div>
      </div>

      {report?.blockers.length ? (
        <div className="metric-card">
          <p className="eyebrow">Critical Blockers</p>
          <p className="panel-title">Do not go live until these are cleared</p>
          <ul className="documentation-list warn">
            {report.blockers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="analysis-list">
        {report?.checks.map((check, index) => (
          <div key={check.id} className={`analysis-item ${check.status === 'pass' ? 'ok' : check.status === 'warn' ? 'warn' : 'critical'}`}>
            <div className="analysis-title">
              Step {index + 1} · {check.label}
            </div>
            <div className="analysis-copy">{check.detail}</div>
            <div className="compact-copy" style={{ marginTop: 8 }}>
              Next action: {check.action}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
