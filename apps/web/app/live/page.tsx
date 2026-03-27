import { SpectatorLiveView } from '../../components/spectator-live-view';

export default async function LivePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return <SpectatorLiveView token={params.token} />;
}
