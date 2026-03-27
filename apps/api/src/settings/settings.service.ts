import { BadRequestException, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { AppSettings, IntegrationSettings, OverlayCustomization, SpectatorSettings, WidgetDefinition } from '@horse-timer/types';
import { addAudit, demoStore } from '../common/demo-store';
import { RuntimeStateService } from '../persistence/runtime-state.service';
import { TimerState } from '@horse-timer/types';
import { SettingsPersistenceService } from './settings.persistence';

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @Inject(SettingsPersistenceService) private readonly persistence: SettingsPersistenceService,
    @Inject(RuntimeStateService) private readonly runtimeStateService?: RuntimeStateService,
  ) {}

  async onModuleInit() {
    await this.reloadFromPersistence();
  }

  getAppSettings() {
    return demoStore.settings;
  }

  getSpectatorSettings() {
    return demoStore.settings.spectator;
  }

  async updateAppSettings(body: Partial<AppSettings>) {
    await this.assertConfigurationUnlocked('platform settings');
    demoStore.settings = {
      ...demoStore.settings,
      ...body,
      arenas: body.arenas ?? demoStore.settings.arenas,
      branding: {
        ...demoStore.settings.branding,
        ...body.branding,
      },
      deployment: {
        ...demoStore.settings.deployment,
        ...body.deployment,
      },
      license: {
        ...demoStore.settings.license,
        ...body.license,
      },
      support: {
        ...demoStore.settings.support,
        ...body.support,
      },
      readinessPolicy: {
        ...demoStore.settings.readinessPolicy,
        ...body.readinessPolicy,
      },
      spectator: {
        ...demoStore.settings.spectator,
        ...body.spectator,
      },
    };
    await this.persistBundle();
    addAudit('APP_SETTINGS_UPDATED', 'SETTINGS', 'app');
    return demoStore.settings;
  }

  async updateSpectatorSettings(body: Partial<SpectatorSettings>) {
    await this.assertConfigurationUnlocked('spectator settings');
    demoStore.settings = {
      ...demoStore.settings,
      spectator: {
        ...demoStore.settings.spectator,
        ...body,
      },
    };
    await this.persistBundle();
    addAudit('SPECTATOR_SETTINGS_UPDATED', 'SETTINGS', 'spectator');
    return demoStore.settings.spectator;
  }

  getOverlaySettings() {
    return demoStore.overlayCustomization;
  }

  async updateOverlaySettings(body: Partial<OverlayCustomization>) {
    await this.assertConfigurationUnlocked('overlay settings');
    demoStore.overlayCustomization = {
      ...demoStore.overlayCustomization,
      ...body,
    };
    await this.persistBundle();
    addAudit('OVERLAY_SETTINGS_UPDATED', 'OVERLAY', 'live');
    return demoStore.overlayCustomization;
  }

  getIntegrationSettings() {
    return demoStore.integrations;
  }

  async updateIntegrationSettings(body: Partial<IntegrationSettings>) {
    await this.assertConfigurationUnlocked('integration settings');
    demoStore.integrations = {
      ...demoStore.integrations,
      ...body,
      hardware: {
        ...demoStore.integrations.hardware,
        ...body.hardware,
      },
      vmix: {
        ...demoStore.integrations.vmix,
        ...body.vmix,
      },
    };
    await this.persistBundle();
    addAudit('INTEGRATIONS_UPDATED', 'SETTINGS', 'integrations');
    return demoStore.integrations;
  }

  listWidgets() {
    return demoStore.widgets;
  }

  getWidget(id: string) {
    return demoStore.widgets.find((item) => item.id === id) ?? null;
  }

  async createWidget(body: Partial<WidgetDefinition>) {
    await this.assertConfigurationUnlocked('widget creation');
    const id = body.id ?? `widget-${Date.now()}`;
    const widget: WidgetDefinition = {
      id,
      name: body.name ?? 'New Widget',
      kind: body.kind ?? 'CUSTOM_MESSAGE',
      status: body.status ?? 'DRAFT',
      route: body.route ?? `/overlay/widget?widget=${id}`,
      width: body.width ?? 760,
      height: body.height ?? 260,
      title: body.title ?? 'New Widget',
      subtitle: body.subtitle ?? 'Custom widget',
      body: body.body ?? 'Configure this widget for broadcast, desktop utility, or operator signage.',
      accentColor: body.accentColor ?? '#6bc6ff',
      backgroundColor: body.backgroundColor ?? 'rgba(4,11,18,0.90)',
      textColor: body.textColor ?? '#fbfdff',
      sponsorName: body.sponsorName ?? 'Broadcast Partner',
      mediaLabel: body.mediaLabel ?? 'Media Slot',
      ctaLabel: body.ctaLabel ?? 'Learn More',
      removable: body.removable ?? true,
      transparentBackground: body.transparentBackground ?? true,
    };
    demoStore.widgets.unshift(widget);
    await this.persistence.saveWidgets(demoStore.widgets);
    addAudit('WIDGET_CREATED', 'WIDGET', widget.id);
    return widget;
  }

  async updateWidget(id: string, body: Partial<WidgetDefinition>) {
    await this.assertConfigurationUnlocked('widget updates');
    const widget = demoStore.widgets.find((item) => item.id === id);
    if (!widget) {
      return null;
    }
    Object.assign(widget, body, {
      route: body.route ?? `/overlay/widget?widget=${id}`,
    });
    await this.persistence.saveWidgets(demoStore.widgets);
    addAudit('WIDGET_UPDATED', 'WIDGET', id);
    return widget;
  }

  async removeWidget(id: string) {
    await this.assertConfigurationUnlocked('widget removal');
    const widget = demoStore.widgets.find((item) => item.id === id);
    if (!widget || !widget.removable) {
      return { removed: false };
    }
    demoStore.widgets = demoStore.widgets.filter((item) => item.id !== id);
    await this.persistence.saveWidgets(demoStore.widgets);
    addAudit('WIDGET_REMOVED', 'WIDGET', id);
    return { removed: true };
  }

  async reloadFromPersistence() {
    const bundle = await this.persistence.loadBundle();
    demoStore.settings = bundle.app;
    demoStore.overlayCustomization = bundle.overlay;
    demoStore.integrations = bundle.integrations;
    demoStore.widgets = await this.persistence.loadWidgets();
    return {
      app: demoStore.settings,
      overlay: demoStore.overlayCustomization,
      integrations: demoStore.integrations,
      widgets: demoStore.widgets,
    };
  }

  async clearCaches() {
    await this.persistence.clearCaches();
    return { cleared: true, at: new Date().toISOString() };
  }

  private async persistBundle() {
    await this.persistence.saveBundle({
      app: demoStore.settings,
      overlay: demoStore.overlayCustomization,
      integrations: demoStore.integrations,
    });
  }

  private async assertConfigurationUnlocked(section: string) {
    if (!demoStore.settings.readinessPolicy.freezeConfigurationDuringLiveRound) {
      return;
    }

    if (!this.runtimeStateService) {
      return;
    }

    const runtime = await this.runtimeStateService.loadRuntimeState();
    const state = runtime?.snapshot?.state;
    const activeStates: TimerState[] = [
      TimerState.WARMUP_RUNNING,
      TimerState.WARMUP_PAUSED,
      TimerState.ROUND_RUNNING,
      TimerState.ROUND_PAUSED,
      TimerState.FINISH_PENDING_CONFIRMATION,
      TimerState.HOLD,
    ];

    if (state && activeStates.includes(state)) {
      throw new BadRequestException(`Configuration is locked while timing is live. Finish or abort the active round before changing ${section}.`);
    }
  }
}
