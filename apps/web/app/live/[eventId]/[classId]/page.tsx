import { SpectatorLiveView } from '../../../../components/spectator-live-view';

export default async function EventClassLivePage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string; classId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <SpectatorLiveView
      eventId={resolvedParams.eventId}
      classId={resolvedParams.classId}
      token={resolvedSearchParams.token}
    />
  );
}
