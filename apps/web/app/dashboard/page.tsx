import { PageFrame } from '../../components/page-frame';
import { DashboardCommandCenter } from '../../components/admin/dashboard-command-center';
import { RealtimeStatusPanel } from '../../components/admin/realtime-status-panel';

export default function DashboardPage() {
  return (
    <PageFrame
      title="Operations Command Center"
      description="Live timing, readiness, reporting, and broadcast control in one focused workspace."
      badge="Production Operations"
    >
      <div className="dashboard-shell">
        <DashboardCommandCenter />
        <RealtimeStatusPanel />
      </div>
    </PageFrame>
  );
}
