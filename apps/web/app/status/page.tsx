import { StatusConsole } from '../../components/admin/status-console';
import { PageFrame } from '../../components/page-frame';

export default function StatusPage() {
  return (
    <PageFrame
      title="System Status"
      description="Live software health, pre-event verification, runtime logs, and automatically detected issue signals for event-day confidence."
      badge="Health and Reliability"
    >
      <StatusConsole />
    </PageFrame>
  );
}
