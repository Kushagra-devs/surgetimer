import { describe, expect, it } from 'vitest';
import { demoStore } from '../src/common/demo-store';
import { DashboardService } from '../src/dashboard/dashboard.service';
import { HardwareService } from '../src/hardware/hardware.service';
import { PrismaService } from '../src/persistence/prisma.service';
import { RedisCacheService } from '../src/persistence/redis-cache.service';
import { QueueService } from '../src/queue/queue.service';
import { SettingsPersistenceService } from '../src/settings/settings.persistence';
import { SettingsService } from '../src/settings/settings.service';
import { TimingService } from '../src/timing/timing.service';
import { VmixService } from '../src/vmix/vmix.service';
import { RealtimeGateway } from '../src/realtime/realtime.gateway';
import { RuntimeStateService } from '../src/persistence/runtime-state.service';

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

class PrismaStub {
  isAvailable() {
    return false;
  }
}

class RedisStub {
  isAvailable() {
    return false;
  }
}

describe('dashboard service', () => {
  it('returns live telemetry and analysis for the dashboard panel', () => {
    const gateway = new GatewayStub();
    const persistence = new PersistenceStub() as unknown as SettingsPersistenceService;
    const runtime = new RuntimeStateStub() as unknown as RuntimeStateService;
    const settings = new SettingsService(persistence);
    const vmix = new VmixService(settings, gateway, runtime);
    const timing = new TimingService(gateway, settings, vmix, runtime);
    const hardware = new HardwareService(timing, gateway, settings, runtime);
    const queue = new QueueService(timing);
    const dashboard = new DashboardService(
      timing,
      hardware,
      vmix,
      settings,
      queue,
      new PrismaStub() as unknown as PrismaService,
      new RedisStub() as unknown as RedisCacheService,
    );

    const realtime = dashboard.getRealtimeStatus();

    expect(realtime.timing.className).toBeTruthy();
    expect(realtime.queue.total).toBeGreaterThan(0);
    expect(Array.isArray(realtime.analysis)).toBe(true);
    expect(realtime.analysis.length).toBeGreaterThan(0);
  });
});
