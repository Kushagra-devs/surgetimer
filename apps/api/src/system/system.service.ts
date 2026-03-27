import { Inject, Injectable } from '@nestjs/common';
import type { PreEventCheckReport, SystemHealthReport } from '@horse-timer/types';
import { addAudit } from '../common/demo-store';
import { DashboardService } from '../dashboard/dashboard.service';
import { HardwareService } from '../hardware/hardware.service';
import { ReportsService } from '../reports/reports.service';
import { RuntimeStateService } from '../persistence/runtime-state.service';
import { SettingsService } from '../settings/settings.service';
import { TimingService } from '../timing/timing.service';

@Injectable()
export class SystemService {
  constructor(
    @Inject(SettingsService) private readonly settingsService: SettingsService,
    @Inject(RuntimeStateService) private readonly runtimeStateService: RuntimeStateService,
    @Inject(TimingService) private readonly timingService: TimingService,
    @Inject(HardwareService) private readonly hardwareService: HardwareService,
    @Inject(DashboardService) private readonly dashboardService: DashboardService,
    @Inject(ReportsService) private readonly reportsService: ReportsService,
  ) {}

  async clearCache() {
    await this.settingsService.clearCaches();
    await this.runtimeStateService.clearRuntimeCaches();
    addAudit('CACHE_CLEARED', 'SYSTEM', 'runtime-cache');

    return {
      ok: true,
      action: 'clear-cache',
      at: new Date().toISOString(),
      message: 'Runtime and settings cache cleared. Refresh client views to load the latest state.',
    };
  }

  async restartRuntime() {
    await this.clearCache();
    await this.settingsService.reloadFromPersistence();
    await this.timingService.reloadFromPersistence();
    const hardware = await this.hardwareService.restartRuntime();
    addAudit('RUNTIME_RESTARTED', 'SYSTEM', 'platform-runtime');

    return {
      ok: true,
      action: 'restart-runtime',
      at: new Date().toISOString(),
      hardware,
      dashboard: this.dashboardService.getRealtimeStatus(),
      message: 'Core services reinitialized from persisted configuration and runtime state.',
    };
  }

  getPreEventChecks(): PreEventCheckReport {
    const settings = this.settingsService.getAppSettings();
    const integrations = this.settingsService.getIntegrationSettings();
    const dashboard = this.dashboardService.getRealtimeStatus();
    const hardware = this.hardwareService.getStatus();
    const policy = settings.readinessPolicy;
    const activeArena = settings.arenas.find((arena) => arena.id === settings.activeArenaId);
    const checks = [
      {
        id: 'arena-profile',
        label: 'Active arena profile',
        status: settings.arenas.some((arena) => arena.id === settings.activeArenaId) ? 'pass' : 'fail',
        detail: settings.arenas.some((arena) => arena.id === settings.activeArenaId)
          ? `Active arena is ${settings.arenas.find((arena) => arena.id === settings.activeArenaId)?.name}.`
          : 'No active arena is selected for the current venue profile.',
        action: 'Select the correct active arena from Platform Profile before the event begins.',
      },
      {
        id: 'hardware-link',
        label: 'ALGE hardware connection',
        status: hardware.connected && hardware.source === 'physical'
          ? 'pass'
          : policy.requirePhysicalHardware
            ? 'fail'
            : hardware.mode === 'mock'
              ? 'warn'
              : 'warn',
        detail: hardware.connected
          ? hardware.source === 'physical'
            ? `Physical ${hardware.mode} hardware link is connected.`
            : 'Simulator is connected; this is not a live ALGE path.'
          : 'No live hardware link is connected.',
        action: 'Open Hardware Console, connect the timing master, and trigger a real beam before opening the class.',
      },
      {
        id: 'parser-rules',
        label: 'Parser rule readiness',
        status: (hardware.parserRuleCount ?? 0) > 0 ? 'pass' : policy.requireParserRules ? 'fail' : 'warn',
        detail: `${hardware.parserRuleCount ?? 0} enabled parser rule(s) are configured.`,
        action: 'Review parser rules and validate a real payload in the parser test area.',
      },
      {
        id: 'queue-depth',
        label: 'Queue and competitor readiness',
        status: dashboard.queue.total > 0
          ? dashboard.queue.ready >= policy.minimumReadyCompetitors
            ? 'pass'
            : policy.requireQueueReadyCompetitor
              ? 'fail'
              : 'warn'
          : 'fail',
        detail: `${dashboard.queue.total} queued competitor(s), ${dashboard.queue.ready} ready for immediate continuation. Policy minimum is ${policy.minimumReadyCompetitors}.`,
        action: 'Load competitors and make sure at least one entry is marked ready before going live.',
      },
      {
        id: 'spectator-publish',
        label: 'Spectator publishing',
        status: settings.spectator.enabled ? 'pass' : policy.requireSpectatorLinkValidation ? 'fail' : 'warn',
        detail: settings.spectator.enabled
          ? `Spectator page is enabled at ${settings.spectator.publicBaseUrl}.`
          : 'Spectator publishing is disabled.',
        action: 'Enable spectator publishing and confirm the QR/share link opens correctly on local devices.',
      },
      {
        id: 'vmix-mode',
        label: 'Broadcast automation',
        status: integrations.vmix.enabled
          ? 'pass'
          : policy.requireVmixIfBroadcastArena && activeArena?.supportsBroadcast
            ? 'fail'
            : 'warn',
        detail: integrations.vmix.enabled
          ? `vMix automation is enabled for input ${integrations.vmix.inputName}.`
          : 'vMix automation is disabled; browser overlay output can still be used manually.',
        action: 'Enable or validate vMix settings if the event requires automatic broadcast control.',
      },
      {
        id: 'persistence',
        label: 'Persistence services',
        status: dashboard.persistence.postgres && dashboard.persistence.redis
          ? 'pass'
          : policy.requirePersistenceForGoLive
            ? 'fail'
            : 'warn',
        detail: `Postgres: ${dashboard.persistence.postgres ? 'online' : 'offline'}, Redis: ${dashboard.persistence.redis ? 'online' : 'offline'}.`,
        action: 'For full production resilience, connect both Postgres and Redis before a live venue deployment.',
      },
      {
        id: 'manual-fallback',
        label: 'Manual fallback posture',
        status: policy.allowManualFallbackStart ? 'pass' : 'warn',
        detail: policy.allowManualFallbackStart
          ? 'Manual judge fallback is allowed if the hardware path drops.'
          : 'Manual judge fallback is disabled by policy; hardware must remain healthy.',
        action: 'Confirm the event team agrees with the fallback policy before live timing begins.',
      },
    ] as const;

    const blockers = checks
      .filter((item) => item.status === 'fail')
      .map((item) => `${item.label}: ${item.action}`);

    const overallStatus = checks.some((item) => item.status === 'fail')
      ? 'fail'
      : checks.some((item) => item.status === 'warn')
        ? 'warn'
        : 'pass';

    return {
      generatedAt: new Date().toISOString(),
      overallStatus,
      summary:
        overallStatus === 'pass'
          ? 'All critical pre-event checks are passing.'
          : overallStatus === 'warn'
            ? 'Core systems are mostly ready, but there are warnings to review before going live.'
            : 'One or more critical checks are failing. Do not start the event until they are resolved.',
      checks: [...checks],
      blockers,
    };
  }

  generateHealthReport(): SystemHealthReport {
    const settings = this.settingsService.getAppSettings();
    const diagnostics = this.reportsService.diagnosticsBundle();
    const hardware = this.hardwareService.getStatus();
    const readiness = this.dashboardService.getRealtimeStatus();
    const status: SystemHealthReport['status'] =
      readiness.readiness === 'ready'
        ? 'healthy'
        : hardware.mode === 'mock'
          ? 'degraded'
          : 'critical';

    const recommendedActions: string[] = [];
    if (!readiness.persistence.postgres) {
      recommendedActions.push('Connect Postgres for durable production persistence.');
    }
    if (!readiness.persistence.redis) {
      recommendedActions.push('Connect Redis for live cache, recovery, and pub/sub resilience.');
    }
    if (!(hardware.connected && hardware.source === 'physical')) {
      recommendedActions.push('Validate the live ALGE connection and confirm a physical hardware feed before event start.');
    }
    if (!settings.spectator.enabled) {
      recommendedActions.push('Enable spectator publishing if audience-facing scoreboards are required.');
    }
    if (!this.settingsService.getIntegrationSettings().vmix.enabled) {
      recommendedActions.push('Keep vMix disabled only if manual browser overlay operation is intentional.');
    }

    return {
      generatedAt: new Date().toISOString(),
      status,
      executiveSummary:
        status === 'healthy'
          ? 'The platform is running in a strong operational state with live-ready dependencies and visibility.'
          : status === 'degraded'
            ? 'The platform is operational but one or more non-fatal dependencies or runtime conditions require attention.'
            : 'The platform has critical issues that should be resolved before relying on it for live production timing.',
      platformProfile: {
        product: settings.branding.productLabel,
        organization: settings.branding.organizationName,
        venueName: settings.venueName,
        activeArena: settings.arenas.find((arena) => arena.id === settings.activeArenaId)?.name ?? 'Unknown Arena',
        deploymentMode: settings.deployment.mode,
        localBaseUrl: settings.deployment.localBaseUrl,
        lanOnly: settings.deployment.enforceLanOnly,
      },
      technicalProfile: {
        frontend: 'Next.js 15 + React + TypeScript + Tailwind CSS',
        backend: 'NestJS + TypeScript + Prisma + Node.js 20+',
        realtime: 'Socket.IO / WebSocket live synchronization',
        persistence: ['PostgreSQL', 'Redis', 'Prisma ORM'],
        hardwareModes: ['Mock simulator', 'Serial / USB serial', 'TCP bridge'],
        broadcast: ['Browser overlay', 'Native desktop widget', 'vMix HTTP integration', 'Spectator live scoreboard'],
        recoveryCapabilities: ['Dashboard cache clear', 'Runtime restart', 'Manual judge fallback', 'Diagnostics bundle generation'],
      },
      readiness: {
        postgres: readiness.persistence.postgres,
        redis: readiness.persistence.redis,
        hardwareConnected: hardware.connected,
        hardwareSource: hardware.source,
        vmixEnabled: this.settingsService.getIntegrationSettings().vmix.enabled,
        spectatorEnabled: settings.spectator.enabled,
      },
      counters: diagnostics.summary,
      diagnostics,
      recommendedActions,
    };
  }

  async generateBackupPack() {
    const settings = this.settingsService.getAppSettings();
    const integrations = this.settingsService.getIntegrationSettings();
    const overlay = this.settingsService.getOverlaySettings();
    const diagnostics = this.reportsService.diagnosticsBundle();
    const runtime = await this.runtimeStateService.loadRuntimeState();

    return {
      generatedAt: new Date().toISOString(),
      packageType: 'surgetimer-backup-pack',
      settings,
      integrations,
      overlay,
      runtime,
      diagnostics,
      health: this.generateHealthReport(),
      preflight: this.getPreEventChecks(),
    };
  }
}
