import { PageFrame } from '../../components/page-frame';
import { EventManager } from '../../components/admin/event-manager';

export default function EventsPage() {
  return (
    <PageFrame title="Events" description="Minimal event CRUD surface for the initial delivery phase.">
      <EventManager />
    </PageFrame>
  );
}
