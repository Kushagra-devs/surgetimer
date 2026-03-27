import { Controller, Get, Inject } from '@nestjs/common';
import { HardwareService } from '../hardware/hardware.service';
import { PrismaService } from '../persistence/prisma.service';
import { RedisCacheService } from '../persistence/redis-cache.service';
import { SettingsService } from '../settings/settings.service';
import { VmixService } from '../vmix/vmix.service';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(HardwareService) private readonly hardwareService: HardwareService,
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(RedisCacheService) private readonly redisCacheService: RedisCacheService,
    @Inject(SettingsService) private readonly settingsService: SettingsService,
    @Inject(VmixService) private readonly vmixService: VmixService,
  ) {}

  @Get('live')
  live() {
    return { status: 'ok', at: new Date().toISOString() };
  }

  @Get('ready')
  ready() {
    const integrations = this.settingsService.getIntegrationSettings();
    const hardware = this.hardwareService.getStatus();
    const hasRealHardwareLink = hardware.connected && hardware.source === 'physical';
    const inSimulationMode = hardware.mode === 'mock';

    return {
      status: hasRealHardwareLink ? 'ready' : inSimulationMode ? 'simulated' : 'degraded',
      hardware,
      persistence: {
        postgres: this.prismaService.isAvailable(),
        redis: this.redisCacheService.isAvailable(),
      },
      vmix: this.vmixService.getStatus(),
      integrations,
      at: new Date().toISOString(),
    };
  }
}
