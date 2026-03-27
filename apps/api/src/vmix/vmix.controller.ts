import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { VmixService } from './vmix.service';

@Controller('vmix')
export class VmixController {
  constructor(@Inject(VmixService) private readonly vmixService: VmixService) {}

  @Get('status')
  status() {
    return this.vmixService.getStatus();
  }

  @Get('overlay-input-url')
  overlayInputUrl() {
    return {
      url: this.vmixService.buildOverlayInputUrl(),
    };
  }

  @Get('package')
  package() {
    return this.vmixService.buildBroadcastPackage();
  }

  @Get('health')
  health() {
    return this.vmixService.getHealth();
  }

  @Post('trigger')
  trigger(@Body('value') value?: string) {
    return this.vmixService.sendPreset(value);
  }

  @Post('test-suite')
  testSuite() {
    return this.vmixService.runTestSuite();
  }
}
