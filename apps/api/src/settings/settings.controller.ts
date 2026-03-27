import { Body, Controller, Delete, Get, Inject, Param, Patch, Post } from '@nestjs/common';
import { HardwareService } from '../hardware/hardware.service';
import { SettingsService } from './settings.service';
import { WidgetLauncherService } from './widget-launcher.service';
import type { AppSettings, IntegrationSettings, OverlayCustomization, SpectatorSettings, WidgetDefinition } from '@horse-timer/types';

@Controller('settings')
export class SettingsController {
  constructor(
    @Inject(SettingsService) private readonly settingsService: SettingsService,
    @Inject(HardwareService) private readonly hardwareService: HardwareService,
    @Inject(WidgetLauncherService) private readonly widgetLauncherService: WidgetLauncherService,
  ) {}

  @Get('app')
  getAppSettings() {
    return this.settingsService.getAppSettings();
  }

  @Get('spectator')
  getSpectatorSettings() {
    return this.settingsService.getSpectatorSettings();
  }

  @Post('app')
  updateAppSettings(@Body() body: Partial<AppSettings>) {
    return this.settingsService.updateAppSettings(body);
  }

  @Post('spectator')
  updateSpectatorSettings(@Body() body: Partial<SpectatorSettings>) {
    return this.settingsService.updateSpectatorSettings(body);
  }

  @Get('overlay')
  getOverlaySettings() {
    return this.settingsService.getOverlaySettings();
  }

  @Post('overlay')
  updateOverlaySettings(@Body() body: Partial<OverlayCustomization>) {
    return this.settingsService.updateOverlaySettings(body);
  }

  @Get('integrations')
  getIntegrationSettings() {
    return this.settingsService.getIntegrationSettings();
  }

  @Post('integrations')
  async updateIntegrationSettings(@Body() body: Partial<IntegrationSettings>) {
    const settings = await this.settingsService.updateIntegrationSettings(body);
    this.hardwareService.reconfigure();
    return settings;
  }

  @Get('widgets')
  listWidgets() {
    return this.settingsService.listWidgets();
  }

  @Get('widgets/:id')
  getWidget(@Param('id') id: string) {
    return this.settingsService.getWidget(id);
  }

  @Post('widgets')
  createWidget(@Body() body: Partial<WidgetDefinition>) {
    return this.settingsService.createWidget(body);
  }

  @Patch('widgets/:id')
  updateWidget(@Param('id') id: string, @Body() body: Partial<WidgetDefinition>) {
    return this.settingsService.updateWidget(id, body);
  }

  @Post('widgets/:id/launch')
  launchWidget(@Param('id') id: string) {
    const widget = this.settingsService.getWidget(id);

    return this.widgetLauncherService.launch({
      widgetId: id,
      width: widget?.width,
      height: widget?.height,
    });
  }

  @Post('widgets/launch-default')
  launchDefaultWidget() {
    return this.widgetLauncherService.launch({});
  }

  @Post('widgets/close-all')
  closeAllWidgets() {
    return this.widgetLauncherService.closeAll();
  }

  @Delete('widgets/:id')
  removeWidget(@Param('id') id: string) {
    return this.settingsService.removeWidget(id);
  }
}
