import { PageFrame } from '../../components/page-frame';
import { CompetitorManager } from '../../components/admin/competitor-manager';

export default function CompetitorsPage() {
  return (
    <PageFrame title="Competitors" description="Rider-horse entries and start list management.">
      <CompetitorManager />
    </PageFrame>
  );
}
