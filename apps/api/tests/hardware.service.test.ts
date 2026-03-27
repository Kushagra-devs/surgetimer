import { describe, expect, it } from 'vitest';
import { demoStore } from '../src/common/demo-store';
import { HardwareService } from '../src/hardware/hardware.service';
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

describe('hardware service', () => {
  it('returns telemetry, parser test results, and raw history', async () => {
    const gateway = new GatewayStub();
    const persistence = new PersistenceStub() as unknown as SettingsPersistenceService;
    const runtime = new RuntimeStateStub() as unknown as RuntimeStateService;
    const settings = new SettingsService(persistence);
    const vmix = new VmixService(settings, gateway, runtime, {
      getStatus() {
        return {
          connected: false,
          mode: 'serial',
          source: 'physical' as const,
          configuredForLiveTiming: true,
        };
      },
    } as unknown as HardwareService);
    const timing = new TimingService(gateway, settings, vmix, runtime);
    const hardware = new HardwareService(timing, gateway, settings, runtime);

    await hardware.testSignal('TRIG', 'C0');
    const parser = hardware.parserTest('C2 FINISH', 'tcp');
    const telemetry = hardware.getTelemetry();

    expect(parser.ok).toBe(true);
    expect(parser.parsed?.type).toBe('FINISH');
    expect(telemetry.logs.length).toBeGreaterThan(0);
    expect(telemetry.lastMessage?.payload).toContain('C0');
    expect(gateway.events.some((event) => event.type === 'hardware.status.updated')).toBe(true);
  });
});
