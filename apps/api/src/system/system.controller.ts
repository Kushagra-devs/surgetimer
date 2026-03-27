import { Controller, Get, Inject, Post } from '@nestjs/common';
import { SystemService } from './system.service';

@Controller('system')
export class SystemController {
  constructor(@Inject(SystemService) private readonly systemService: SystemService) {}

  @Post('clear-cache')
  clearCache() {
    return this.systemService.clearCache();
  }

  @Post('restart-runtime')
  restartRuntime() {
    return this.systemService.restartRuntime();
  }

  @Get('preflight-checks')
  getPreflightChecks() {
    return this.systemService.getPreEventChecks();
  }

  @Post('generate-health-report')
  generateHealthReport() {
    return this.systemService.generateHealthReport();
  }

  @Get('backup-pack')
  backupPack() {
    return this.systemService.generateBackupPack();
  }
}
