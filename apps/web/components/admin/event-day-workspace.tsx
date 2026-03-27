'use client';

import { DashboardCommandCenter } from './dashboard-command-center';
import { RealtimeStatusPanel } from './realtime-status-panel';

export function EventDayWorkspace() {
  return (
    <div className="section-stack">
      <div className="metric-card">
        <p className="eyebrow">Event-Day Mode</p>
        <p className="panel-title">Reduced live surface for trusted operation</p>
        <p className="muted" style={{ marginTop: 0 }}>
          This workspace is intentionally limited to the critical event-day surfaces only. Use it when you want the software to feel quieter and more trustworthy during live competition.
        </p>
        <div className="button-grid" style={{ marginTop: 18 }}>
          <a className="action-button accent" href="/judge">Open Judge</a>
          <a className="action-button" href="/queue">Open Queue</a>
          <a className="action-button" href="/hardware-console">Hardware Console</a>
          <a className="action-button" href="/reports">Reports</a>
          <a className="action-button" href="/run-logs">Run Logs</a>
          <a className="action-button" href="/documentation">Documentation</a>
        </div>
      </div>

      <DashboardCommandCenter />
      <RealtimeStatusPanel />

      <div className="section-grid">
        <div className="metric-card surface-soft">
          <p className="eyebrow">Live Rule</p>
          <p className="panel-title">Do not configure during a live round</p>
          <p className="tip-copy">Keep hardware changes, branding edits, and admin configuration outside the critical path. If something fails, use fallback and recovery actions instead of exploring the full admin surface mid-round.</p>
        </div>
        <div className="metric-card surface-soft">
          <p className="eyebrow">Trust Rule</p>
          <p className="panel-title">Only trust what has been rehearsed</p>
          <p className="tip-copy">If the hardware path, parser, and operator workflow have not been rehearsed successfully on the venue setup, treat the system as yellow or red readiness rather than green.</p>
        </div>
      </div>
    </div>
  );
}
