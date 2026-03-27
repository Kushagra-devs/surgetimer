import { Controller, Get, Header, Inject, Query } from '@nestjs/common';
import { OverlayService } from './overlay.service';

@Controller('overlay')
export class OverlayController {
  constructor(@Inject(OverlayService) private readonly overlayService: OverlayService) {}

  @Get('state.json')
  stateJson() {
    return this.overlayService.getLiveState();
  }

  @Get('config.json')
  configJson() {
    return this.overlayService.getCustomization();
  }

  @Get('vmix-datasource.json')
  vmixDatasourceJson() {
    return this.overlayService.getVmixDataSourceRecord();
  }

  @Get('vmix-datasource.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  vmixDatasourceCsv() {
    return this.overlayService.getVmixDataSourceCsv();
  }

  @Get('public-feed')
  publicFeed(
    @Query('eventId') eventId?: string,
    @Query('classId') classId?: string,
    @Query('token') token?: string,
  ) {
    return this.overlayService.getPublicFeed({ eventId, classId, token });
  }

  @Get('live')
  live() {
    return {
      message: 'Use the Next.js overlay route at /overlay/live for browser rendering.',
    };
  }
}
