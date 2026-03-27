import { PageFrame } from '../../../components/page-frame';

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  return (
    <PageFrame title={`Event ${eventId}`} description="Event details, classes, queue context, and reports will expand from this route.">
      <div className="metric-card">Event detail route is scaffolded and ready for deeper CRUD wiring.</div>
    </PageFrame>
  );
}

