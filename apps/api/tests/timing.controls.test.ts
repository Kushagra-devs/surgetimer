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


describe('timing control actions', () => {
  it('supports manual judge control flow for warmup, main, pause, resume, and stop', () => {
    const gateway = new GatewayStub();
    const persistence = new PersistenceStub() as unknown as SettingsPersistenceService;
    const runtime = new RuntimeStateStub() as unknown as RuntimeStateService;
    const settings = new SettingsService(persistence, runtime);
    const vmix = new VmixService(settings, gateway, runtime);
    const service = new TimingService(gateway, settings, vmix, runtime);

    const armed = service.armCompetitor('entry-1');
    const warmup = service.manualWarmupStart();
    const running = service.manualMainStart();
    const paused = service.pause();
    const resumed = service.resume();
    const stopped = service.manualStop();

    expect(armed.snapshot.state).toBe('READY');
    expect(warmup.snapshot.state).toBe('WARMUP_RUNNING');
    expect(running.snapshot.state).toBe('ROUND_RUNNING');
    expect(paused.snapshot.state).toBe('ROUND_PAUSED');
    expect(resumed.snapshot.state).toBe('ROUND_RUNNING');
    expect(stopped.snapshot.state).toBe('COMPLETED');
    expect(gateway.events.some((event) => event.type === 'run.completed')).toBe(true);
  });
});
