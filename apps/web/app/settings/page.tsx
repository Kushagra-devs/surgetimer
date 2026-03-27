import { PageFrame } from '../../components/page-frame';
import { SettingsWorkspace } from '../../components/admin/settings-workspace';

export default function SettingsPage() {
  return (
    <PageFrame title="Settings" description="Focused workspace for venue settings, hardware integrations, spectator sharing, and overlay configuration." badge="Configuration Workspace">
      <SettingsWorkspace />
    </PageFrame>
  );
}
