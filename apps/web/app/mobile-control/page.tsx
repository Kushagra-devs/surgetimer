import { MobileControlPanel } from '../../components/mobile-control-panel';

export default async function MobileControlPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  return <MobileControlPanel initialCode={params.code} />;
}
