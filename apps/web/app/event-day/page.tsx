import { PageFrame } from '../../components/page-frame';
import { EventDayWorkspace } from '../../components/admin/event-day-workspace';

export default function EventDayPage() {
  return (
    <PageFrame
      title="Event-Day Mode"
      description="Reduced live-operations workspace with only the critical surfaces needed during competition."
      badge="Live Show Mode"
    >
      <EventDayWorkspace />
    </PageFrame>
  );
}
