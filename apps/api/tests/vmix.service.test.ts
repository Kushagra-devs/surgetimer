import { describe, expect, it, vi } from 'vitest';
import { demoStore } from '../src/common/demo-store';
import { RuntimeStateService } from '../src/persistence/runtime-state.service';
import { RealtimeGateway } from '../src/realtime/realtime.gateway';
import { SettingsPersistenceService } from '../src/settings/settings.persistence';
import { SettingsService } from '../src/settings/settings.service';
import { VmixService } from '../src/vmix/vmix.service';

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


describe('vmix service', () => {
  it('builds a vMix API url from configured preset data', async () => {
    const settings = new SettingsService(new PersistenceStub() as unknown as SettingsPersistenceService);
    await settings.updateIntegrationSettings({
      vmix: {
        enabled: false,
        baseUrl: 'http://127.0.0.1:8088/api',
        inputName: 'HorseTimerOverlay',
        titleField: 'TimerText',
        autoTriggerOnStateChange: true,
        triggerPreset: 'SET_TEXT',
        triggerValue: 'LIVE',
        dataSourcePath: './data/vmix-overlay.csv',
      },
    });

    const gateway = { broadcast: vi.fn() } as unknown as RealtimeGateway;
    const runtime = new RuntimeStateStub() as unknown as RuntimeStateService;
    const service = new VmixService(settings, gateway, runtime);
    const result = await service.sendPreset('READY 00.00');

    expect(result.ok).toBe(true);
    expect(result.simulated).toBe(true);
    expect(result.url).toContain('Function=SetText');
    expect(result.url).toContain('Input=HorseTimerOverlay');
    expect(result.url).toContain('SelectedName=TimerText');
  });
});
