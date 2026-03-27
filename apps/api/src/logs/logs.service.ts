import { Inject, Injectable } from '@nestjs/common';
import { demoStore } from '../common/demo-store';
import { HardwareService } from '../hardware/hardware.service';
import { ReportsService } from '../reports/reports.service';
import { VmixService } from '../vmix/vmix.service';

@Injectable()
export class LogsService {
  constructor(
    @Inject(HardwareService) private readonly hardwareService: HardwareService,
    @Inject(VmixService) private readonly vmixService: VmixService,
    @Inject(ReportsService) private readonly reportsService: ReportsService,
  ) {}

  listAudit() {
    return demoStore.auditLogs;
  }

  systemFeed() {
    const hardware = this.hardwareService.getTelemetry();
    const vmix = this.vmixService.getStatus();

    return {
      generatedAt: new Date().toISOString(),
      summary: this.reportsService.summary(),
      audit: demoStore.auditLogs,
      hardwareDiagnostics: hardware.diagnostics,
      hardwareLogs: hardware.logs,
      vmixTelemetry: vmix.telemetry,
    };
  }
}
