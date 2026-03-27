'use client';

import { useEffect, useState } from 'react';
import type { SystemHealthReport } from '@horse-timer/types';
import { apiPost } from '../../lib/api';

export function SystemHealthReportConsole() {
  const [report, setReport] = useState<SystemHealthReport | null>(null);
  const [generating, setGenerating] = useState(false);

  async function generate() {
    setGenerating(true);
    try {
      const next = await apiPost<SystemHealthReport>('/system/generate-health-report', {});
      setReport(next);
    } finally {
      setGenerating(false);
    }
  }

  useEffect(() => {
    void generate();
  }, []);

  function download() {
    if (!report) {
      return;
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `surgetimer-system-health-${report.generatedAt.replace(/[:.]/g, '-')}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="section-stack">
      <div className="metric-card">
        <p className="eyebrow">System Health Report</p>
        <p className="panel-title">Deep technical system report with generation and download controls</p>
        <div className="split-row" style={{ flexWrap: 'wrap', marginTop: 18 }}>
          <div className={`incident-strip ${report?.status === 'healthy' ? 'ok' : report?.status === 'degraded' ? 'warn' : 'critical'}`} style={{ margin: 0 }}>
            {report ? `${report.status.toUpperCase()} · ${report.executiveSummary}` : 'Generating current system report...'}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="action-button" onClick={() => void generate()} disabled={generating}>
              {generating ? 'Generating...' : 'Generate Report'}
            </button>
            <button className="action-button accent" onClick={download} disabled={!report}>
              Download Report
            </button>
          </div>
        </div>
      </div>

      {report ? (
        <>
          <div className="section-grid admin-two-panel">
            <div className="metric-card">
              <p className="eyebrow">Platform Profile</p>
              <p className="panel-title">{report.platformProfile.product}</p>
              <div className="info-list">
                <div className="info-row"><span className="info-label">Organization</span><span className="info-value">{report.platformProfile.organization}</span></div>
                <div className="info-row"><span className="info-label">Venue</span><span className="info-value">{report.platformProfile.venueName}</span></div>
                <div className="info-row"><span className="info-label">Active arena</span><span className="info-value">{report.platformProfile.activeArena}</span></div>
                <div className="info-row"><span className="info-label">Deployment mode</span><span className="info-value">{report.platformProfile.deploymentMode}</span></div>
                <div className="info-row"><span className="info-label">Local base URL</span><span className="info-value">{report.platformProfile.localBaseUrl}</span></div>
              </div>
            </div>

            <div className="metric-card">
              <p className="eyebrow">Readiness</p>
              <p className="panel-title">Current dependency posture</p>
              <div className="info-list">
                <div className="info-row"><span className="info-label">Postgres</span><span className="info-value">{report.readiness.postgres ? 'Online' : 'Offline'}</span></div>
                <div className="info-row"><span className="info-label">Redis</span><span className="info-value">{report.readiness.redis ? 'Online' : 'Offline'}</span></div>
                <div className="info-row"><span className="info-label">Hardware</span><span className="info-value">{report.readiness.hardwareConnected ? `${report.readiness.hardwareSource} connected` : 'Offline'}</span></div>
                <div className="info-row"><span className="info-label">vMix</span><span className="info-value">{report.readiness.vmixEnabled ? 'Enabled' : 'Manual mode'}</span></div>
                <div className="info-row"><span className="info-label">Spectator</span><span className="info-value">{report.readiness.spectatorEnabled ? 'Enabled' : 'Disabled'}</span></div>
              </div>
            </div>
          </div>

          <div className="section-grid admin-two-panel">
            <div className="metric-card">
              <p className="eyebrow">Technical Details</p>
              <p className="panel-title">Software architecture</p>
              <ul className="documentation-list">
                <li>{report.technicalProfile.frontend}</li>
                <li>{report.technicalProfile.backend}</li>
                <li>{report.technicalProfile.realtime}</li>
                <li>Persistence: {report.technicalProfile.persistence.join(', ')}</li>
                <li>Hardware modes: {report.technicalProfile.hardwareModes.join(', ')}</li>
                <li>Broadcast: {report.technicalProfile.broadcast.join(', ')}</li>
                <li>Recovery: {report.technicalProfile.recoveryCapabilities.join(', ')}</li>
              </ul>
            </div>

            <div className="metric-card">
              <p className="eyebrow">Operational Counters</p>
              <p className="panel-title">System report summary</p>
              <div className="info-list">
                <div className="info-row"><span className="info-label">Events</span><span className="info-value">{report.counters.totalEvents}</span></div>
                <div className="info-row"><span className="info-label">Active events</span><span className="info-value">{report.counters.activeEvents}</span></div>
                <div className="info-row"><span className="info-label">Arenas</span><span className="info-value">{report.counters.totalArenas}</span></div>
                <div className="info-row"><span className="info-label">Competitors</span><span className="info-value">{report.counters.totalCompetitors}</span></div>
                <div className="info-row"><span className="info-label">Completed runs</span><span className="info-value">{report.counters.completedRuns}</span></div>
                <div className="info-row"><span className="info-label">Disconnects</span><span className="info-value">{report.counters.hardwareDisconnects}</span></div>
              </div>
            </div>
          </div>

          <div className="metric-card">
            <p className="eyebrow">Recommended Actions</p>
            <p className="panel-title">What to do next</p>
            <ul className="documentation-list warn">
              {report.recommendedActions.length > 0 ? report.recommendedActions.map((item) => <li key={item}>{item}</li>) : <li>No immediate corrective actions are recommended.</li>}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
