import { PageFrame } from '../../components/page-frame';
import { WidgetManager } from '../../components/admin/widget-manager';

export default function WidgetsPage() {
  return (
    <PageFrame
      title="Widgets"
      description="Create, launch, preview, and manage broadcast and utility widgets from one focused workspace."
      badge="Widget Control"
    >
      <WidgetManager />
    </PageFrame>
  );
}
