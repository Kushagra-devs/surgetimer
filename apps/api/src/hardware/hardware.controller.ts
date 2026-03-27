import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { HardwareService } from './hardware.service';

@Controller('hardware')
export class HardwareController {
  constructor(@Inject(HardwareService) private readonly hardwareService: HardwareService) {}

  @Get('status')
  status() {
    return this.hardwareService.getStatus();
  }

  @Get('logs')
  logs() {
    return this.hardwareService.getLogs();
  }

  @Get('diagnostics')
  diagnostics() {
    return this.hardwareService.getDiagnostics();
  }

  @Get('telemetry')
  telemetry() {
    return this.hardwareService.getTelemetry();
  }

  @Get('commissioning-checks')
  commissioningChecks() {
    return this.hardwareService.getCommissioningReport();
  }

  @Get('serial-ports')
  serialPorts() {
    return this.hardwareService.listSerialPorts();
  }

  @Post('connect')
  connect() {
    return this.hardwareService.connect();
  }

  @Post('disconnect')
  disconnect() {
    return this.hardwareService.disconnect();
  }

  @Post('reconfigure')
  reconfigure() {
    return this.hardwareService.reconfigure();
  }

  @Post('test-signal')
  testSignal(@Body('payload') payload?: string, @Body('channel') channel?: string) {
    return this.hardwareService.testSignal(payload, channel);
  }

  @Post('test-connection')
  testConnection() {
    return this.hardwareService.testConnection();
  }

  @Post('verify-link')
  verifyLink() {
    return this.hardwareService.verifyCurrentLink();
  }

  @Post('test-parser')
  testParser(@Body('payload') payload?: string, @Body('source') source?: 'serial' | 'usb-serial' | 'tcp') {
    return this.hardwareService.parserTest(payload ?? '', source ?? 'serial');
  }
}
