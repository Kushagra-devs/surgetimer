import { describe, expect, it } from 'vitest';
import { demoStore } from '../src/common/demo-store';
import { SettingsPersistenceService } from '../src/settings/settings.persistence';
import { SettingsService } from '../src/settings/settings.service';

class PersistenceStub {
  async loadBundle() {
    return {
      app: demoStore.settings,
      overlay: demoStore.overlayCustomization,
      integrations: demoStore.integrations,
    };
  }

  async saveBundle(bundle: typeof demoStore.settings extends infer _ ? {
    app: typeof demoStore.settings;
    overlay: typeof demoStore.overlayCustomization;
    integrations: typeof demoStore.integrations;
  } : never) {
    return bundle;
  }

  async loadWidgets() {
    return demoStore.widgets;
  }

  async saveWidgets() {
    return;
  }
}

describe('settings service', () => {
  it('updates overlay and app settings for admin control surfaces', async () => {
    const service = new SettingsService(new PersistenceStub() as unknown as SettingsPersistenceService);

    const app = await service.updateAppSettings({
      venueName: 'Prime Arena',
      widgetWidth: 900,
      activeArenaId: 'arena-schooling',
      branding: {
        ...demoStore.settings.branding,
        organizationName: 'Prime Equestrian Group',
      },
    });
    const overlay = await service.updateOverlaySettings({
      themeName: 'Widget Gold',
      compactMode: true,
      layout: 'WIDGET',
    });

    expect(app.venueName).toBe('Prime Arena');
    expect(app.widgetWidth).toBe(900);
    expect(app.activeArenaId).toBe('arena-schooling');
    expect(app.branding.organizationName).toBe('Prime Equestrian Group');
    expect(overlay.themeName).toBe('Widget Gold');
    expect(overlay.compactMode).toBe(true);
    expect(overlay.layout).toBe('WIDGET');
  });

  it('updates integration settings for hardware and vmix deployments', async () => {
    const service = new SettingsService(new PersistenceStub() as unknown as SettingsPersistenceService);

    const integrations = await service.updateIntegrationSettings({
      hardware: {
        adapterMode: 'tcp',
        tcpHost: '192.168.0.50',
        tcpPort: 4001,
      },
      vmix: {
        enabled: true,
        baseUrl: 'http://127.0.0.1:8088/api',
        inputName: 'ArenaOverlay',
        autoTriggerOnStateChange: true,
      },
    });

    expect(integrations.hardware.adapterMode).toBe('tcp');
    expect(integrations.hardware.tcpHost).toBe('192.168.0.50');
    expect(integrations.hardware.tcpPort).toBe(4001);
    expect(integrations.vmix.enabled).toBe(true);
    expect(integrations.vmix.inputName).toBe('ArenaOverlay');
    expect(integrations.vmix.autoTriggerOnStateChange).toBe(true);
  });
});
