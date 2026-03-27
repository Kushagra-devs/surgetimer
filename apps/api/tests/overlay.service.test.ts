import { describe, expect, it } from 'vitest';
import { demoStore } from '../src/common/demo-store';
import { OverlayService } from '../src/overlay/overlay.service';
import { RuntimeStateService } from '../src/persistence/runtime-state.service';
import { RealtimeGateway } from '../src/realtime/realtime.gateway';
import { SettingsPersistenceService } from '../src/settings/settings.persistence';
import { SettingsService } from '../src/settings/settings.service';
import { TimingService } from '../src/timing/timing.service';
import { VmixService } from '../src/vmix/vmix.service';

class GatewayStub extends RealtimeGateway {
  override broadcast(): void {}
}

class PersistenceStub {
  async loadBundle() {
    return {
      app: demoStore.settings,
      overlay: demoStore.overlayCustomization,
      integrations: demoStore.integrations,
    };
  }
  async saveBundle(bundle: unknown) {
    return bundle;
  }
  async loadWidgets() {
    return demoStore.widgets;
  }
  async saveWidgets() {
    return;
  }
}

class RuntimeStateStub {
  async loadRuntimeState() {
    return null;
  }
  async saveRuntimeState() {
    return;
  }
  async loadDiagnostics() {
    return [];
  }
  async saveDiagnostic() {
    return;
  }
  async loadVmixTelemetry() {
    return [];
  }
  async saveVmixTelemetry() {
    return;
  }
}


describe('overlay service', () => {
  it('builds a spectator feed with event/class routing and token support', () => {
    const gateway = new GatewayStub();
    const persistence = new PersistenceStub() as unknown as SettingsPersistenceService;
    const runtime = new RuntimeStateStub() as unknown as RuntimeStateService;
    const settings = new SettingsService(persistence);
    const timing = new TimingService(gateway, settings, new VmixService(settings, gateway, runtime), runtime);
    const overlay = new OverlayService(timing);

    const feed = overlay.getPublicFeed({ eventId: 'event-demo', classId: 'class-demo' });

    expect(feed.eventId).toBe('event-demo');
    expect(feed.classId).toBe('class-demo');
    expect(feed.shareUrl).toContain('/live/event-demo/class-demo');
    expect(feed.spectator.title).toBeTruthy();
  });
});
