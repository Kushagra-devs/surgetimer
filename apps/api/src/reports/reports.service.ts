import { Inject, Injectable } from '@nestjs/common';
import type { DiagnosticsBundle } from '@horse-timer/types';
import { demoStore, getReportSummary } from '../common/demo-store';
import { HardwareService } from '../hardware/hardware.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class ReportsService {
  constructor(
    @Inject(HardwareService) private readonly hardwareService: HardwareService,
    @Inject(SettingsService) private readonly settingsService: SettingsService,
  ) {}

  summary() {
    return getReportSummary();
  }

  runs() {
    return demoStore.competitors.map((competitor) => ({
      rider: competitor.riderName,
      horse: competitor.horseName,
      bib: competitor.bibNumber,
      status: competitor.status,
      classId: competitor.classId,
    }));
  }

  diagnosticsBundle(): DiagnosticsBundle {
    const settings = this.settingsService.getAppSettings();
    const activeArena = settings.arenas.find((arena) => arena.id === settings.activeArenaId) ?? settings.arenas[0];
    const notes = [
      settings.deployment.enforceLanOnly
        ? 'LAN-only deployment is enabled for venue-safe operation.'
        : 'External network access is allowed; review firewall posture before go-live.',
      settings.support.remoteAssistEnabled
        ? 'Remote diagnostics assistance is enabled under the current support profile.'
        : 'Remote diagnostics assistance is disabled; support will rely on exported bundles only.',
      settings.deployment.cacheCriticalRoutes
        ? 'Critical spectator and operator routes are marked for offline-friendly caching.'
        : 'Critical route caching is disabled.',
    ];

    return {
      generatedAt: new Date().toISOString(),
      site: {
        venueName: settings.venueName,
        activeArenaId: settings.activeArenaId,
        activeArenaName: activeArena?.name ?? 'Unknown Arena',
        organizationName: settings.branding.organizationName,
        deploymentMode: settings.deployment.mode,
        localBaseUrl: settings.deployment.localBaseUrl,
      },
      license: settings.license,
      support: settings.support,
      summary: this.summary(),
      hardware: this.hardwareService.getTelemetry(),
      integrations: this.settingsService.getIntegrationSettings(),
      overlay: this.settingsService.getOverlaySettings(),
      recentAudit: demoStore.auditLogs.slice(0, 25),
      notes,
    };
  }
}
