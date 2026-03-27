import { describe, expect, it } from 'vitest';
import { demoStore } from '../src/common/demo-store';
import { RuntimeStateService } from '../src/persistence/runtime-state.service';
import { RealtimeGateway } from '../src/realtime/realtime.gateway';
import { SettingsPersistenceService } from '../src/settings/settings.persistence';
import { SettingsService } from '../src/settings/settings.service';
import { TimingService } from '../src/timing/timing.service';
import { VmixService } from '../src/vmix/vmix.service';

class GatewayStub extends RealtimeGateway {
  public events: Array<{ type: string; payload: unknown }> = [];

  override broadcast<TPayload>(type: string, payload: TPayload): void {
    this.events.push({ type, payload });
  }
}

class PersistenceStub {
  async loadBundle() {
    return {
      app: demoStore.settings,
      overlay: demoStore.overlayCustomization,
      integrations: demoStore.integrations,
    };
  }

  async saveBundle(bundle: {
    app: typeof demoStore.settings;
    overlay: typeof demoStore.overlayCustomization;
    integrations: typeof demoStore.integrations;
  }) {
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


describe('timing service integration flow', () => {
  it('handles warmup, main start, and completion from mock signals', () => {
    const gateway = new GatewayStub();
    const persistence = new PersistenceStub() as unknown as SettingsPersistenceService;
    const runtime = new RuntimeStateStub() as unknown as RuntimeStateService;
    const settings = new SettingsService(persistence);
    const vmix = new VmixService(settings, gateway, runtime);
    const service = new TimingService(gateway, settings, vmix, runtime);

    service.armCompetitor('entry-1');
    const warmup = service.registerSensorTrigger('C0', 'C0 TRIG', '2026-03-27T10:00:00.000Z');
    const running = service.registerSensorTrigger('C0', 'C0 TRIG 2', '2026-03-27T10:00:01.000Z');
    const completed = service.registerSensorTrigger('C2', 'C2 FINISH', '2026-03-27T10:00:12.000Z');

    expect(warmup.snapshot.state).toBe('WARMUP_RUNNING');
    expect(running.snapshot.state).toBe('ROUND_RUNNING');
    expect(completed.snapshot.state).toBe('COMPLETED');
    expect(gateway.events.some((event) => event.type === 'run.completed')).toBe(true);
  });
});
