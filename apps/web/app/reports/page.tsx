import { PageFrame } from '../../components/page-frame';
import { RealtimeReportsConsole } from '../../components/admin/realtime-reports-console';

export default function ReportsPage() {
  return (
    <PageFrame title="Realtime Reports" description="Live operational reporting for runs, incidents, hardware activity, and platform readiness." badge="Reporting and Audit">
      <RealtimeReportsConsole />
    </PageFrame>
  );
}
