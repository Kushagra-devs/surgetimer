import { PageFrame } from '../../components/page-frame';
import { HardwareConnectionWizard } from '../../components/admin/hardware-connection-wizard';
import { HardwareGuideTabs } from '../../components/admin/hardware-guide-tabs';
import { HardwareRealtimeConsole } from '../../components/admin/hardware-realtime-console';

export default function HardwareConsolePage() {
  return (
    <PageFrame title="Hardware Console" description="Parser validation, raw monitor, and adapter status for venue setup.">
      <div className="section-stack">
        <HardwareConnectionWizard />
        <HardwareGuideTabs />
        <HardwareRealtimeConsole />
      </div>
    </PageFrame>
  );
}
