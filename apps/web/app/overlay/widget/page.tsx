import { OverlayLive } from '../../../components/overlay-live';

export default async function OverlayWidgetPage({
  searchParams,
}: {
  searchParams: Promise<{ desktop?: string; widget?: string }>;
}) {
  const params = await searchParams;
  return <OverlayLive mode="widget" desktopShell={params.desktop === '1'} widgetId={params.widget} />;
}
