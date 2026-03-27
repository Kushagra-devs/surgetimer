import { PageFrame } from '../../components/page-frame';
import { SuperAdminConsole } from '../../components/admin/super-admin-console';

export default function SuperAdminPage() {
  return (
    <PageFrame
      title="Super Admin"
      description="Compact enterprise control center for policy, integrations, broadcast assets, and governance."
      badge="Administrative Governance"
    >
      <SuperAdminConsole />
    </PageFrame>
  );
}
