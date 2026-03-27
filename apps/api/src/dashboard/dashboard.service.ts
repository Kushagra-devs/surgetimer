import { Inject, Injectable } from '@nestjs/common';
import { demoStore, getReportSummary } from '../common/demo-store';
import { HardwareService } from '../hardware/hardware.service';
import { PrismaService } from '../persistence/prisma.service';
import { RedisCacheService } from '../persistence/redis-cache.service';
import { QueueService } from '../queue/queue.service';
import { SettingsService } from '../settings/settings.service';
import { TimingService } from '../timing/timing.service';
import { VmixService } from '../vmix/vmix.service';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(TimingService) private readonly timingService: TimingService,
    @Inject(HardwareService) private readonly hardwareService: HardwareService,
    @Inject(VmixService) private readonly vmixService: VmixService,
    @Inject(SettingsService) private readonly settingsService: SettingsService,
    @Inject(QueueService) private readonly queueService: QueueService,
    @Inject(PrismaService) private readonly prismaService: PrismaService,
    @Inject(RedisCacheService) private readonly redisCacheService: RedisCacheService,
  ) {}

  getRealtimeStatus() {
    const state = this.timingService.getState();
    const activeCompetitor = state.competitor;
    const activeClassId = activeCompetitor?.classId ?? demoStore.classes[0]?.id ?? 'class-demo';
    const activeClass = demoStore.classes.find((item) => item.id === activeClassId) ?? null;
    const activeEvent = activeClass ? demoStore.events.find((item) => item.id === activeClass.eventId) ?? null : null;
    const queue = this.queueService.list(activeClassId);
    const hardware = this.hardwareService.getStatus();
    const lastHardwareMessage = this.hardwareService.getLogs()[0] ?? null;
    const vmix = this.vmixService.getStatus();
    const reports = getReportSummary();
    const persistence = {
      postgres: this.prismaService.isAvailable(),
      redis: this.redisCacheService.isAvailable(),
    };
    const hasRealHardwareLink = hardware.connected && hardware.source === 'physical';
    const inSimulationMode = hardware.mode === 'mock';
    const policy = this.settingsService.getAppSettings().readinessPolicy;
    const goLiveBlockers: string[] = [];

    if (policy.requirePhysicalHardware && !hasRealHardwareLink) {
      goLiveBlockers.push('Physical ALGE hardware link is required by policy.');
    }
    if (policy.requireParserRules && (hardware.parserRuleCount ?? 0) <= 0) {
      goLiveBlockers.push('At least one enabled parser rule is required by policy.');
    }
    if (policy.requireQueueReadyCompetitor && queue.filter((item) => item.status === 'READY').length < policy.minimumReadyCompetitors) {
      goLiveBlockers.push(`At least ${policy.minimumReadyCompetitors} ready competitor(s) are required by policy.`);
    }
    if (policy.requirePersistenceForGoLive && !(persistence.postgres && persistence.redis)) {
      goLiveBlockers.push('Postgres and Redis are required by policy before go-live.');
    }

    return {
      at: new Date().toISOString(),
      readiness: hasRealHardwareLink ? 'ready' : inSimulationMode ? 'simulated' : 'degraded',
      goLive: {
        allowed: goLiveBlockers.length === 0,
        blockers: goLiveBlockers,
        policy,
      },
      timing: {
        state: state.snapshot.state,
        elapsedMs: state.elapsedMs,
        competitor: activeCompetitor,
        classId: activeClassId,
        className: activeClass?.name ?? 'Awaiting class',
        eventName: activeEvent?.name ?? 'Awaiting event',
        lastSensorMessage: state.snapshot.context.lastSensorMessage,
        warnings: state.snapshot.context.warnings,
      },
      hardware: {
        ...hardware,
        lastMessage: lastHardwareMessage,
      },
      vmix,
      queue: {
        total: queue.length,
        ready: queue.filter((item) => item.status === 'READY').length,
        staged: queue.filter((item) => item.status === 'QUEUED').length,
        preview: queue.slice(0, 5),
      },
      persistence,
      reports,
      analysis: this.buildAnalysis({
        hardwareConnected: hardware.connected,
        timingState: state.snapshot.state,
        warningCount: state.snapshot.context.warnings.length,
        queueReady: queue.filter((item) => item.status === 'READY').length,
        vmixEnabled: vmix.enabled,
        vmixRecent: vmix.telemetry?.[0] ?? null,
        duplicateSignals: reports.duplicateSignals,
        lastSensorAt: state.snapshot.context.lastSensorMessage?.at ?? null,
      }),
    };
  }

  private buildAnalysis(input: {
    hardwareConnected: boolean;
    timingState: string;
    warningCount: number;
    queueReady: number;
    vmixEnabled: boolean;
    vmixRecent: { ok?: boolean } | null;
    duplicateSignals: number;
    lastSensorAt: string | null;
  }) {
    const items: Array<{ level: 'ok' | 'warn' | 'critical'; title: string; detail: string }> = [];

    items.push(
      input.hardwareConnected
        ? { level: 'ok', title: 'Hardware link healthy', detail: 'ALGE input path is currently connected and available for live timing.' }
        : { level: 'critical', title: 'Hardware link offline', detail: 'No real ALGE hardware link is connected. Timing can continue only through manual or simulator control.' },
    );

    items.push(
      ['ROUND_RUNNING', 'WARMUP_RUNNING', 'ROUND_PAUSED', 'WARMUP_PAUSED', 'HOLD'].includes(input.timingState)
        ? { level: 'warn', title: 'Live round attention', detail: `Timer is in ${input.timingState}. Avoid non-essential admin changes during the active sequence.` }
        : { level: 'ok', title: 'Timing path calm', detail: `Timer is in ${input.timingState}. System is ready for the next controlled action.` },
    );

    items.push(
      input.queueReady <= 1
        ? { level: 'warn', title: 'Queue getting shallow', detail: 'Only one or fewer ready competitors are available for immediate continuation.' }
        : { level: 'ok', title: 'Queue continuity healthy', detail: `${input.queueReady} ready competitor(s) are available for the next sequence.` },
    );

    if (input.warningCount > 0 || input.duplicateSignals > 0) {
      items.push({
        level: 'warn',
        title: 'Signal quality watch',
        detail: `${input.warningCount} active timing warning(s) and ${input.duplicateSignals} duplicate signal(s) recorded.`,
      });
    } else {
      items.push({
        level: 'ok',
        title: 'Signal path stable',
        detail: 'No active timing warnings or duplicate signal pressure detected.',
      });
    }

    items.push(
      input.vmixEnabled
        ? {
            level: input.vmixRecent && input.vmixRecent.ok === false ? 'warn' : 'ok',
            title: 'vMix integration',
            detail: input.vmixRecent && input.vmixRecent.ok === false
              ? 'vMix is enabled, but the most recent command reported a failure.'
              : 'vMix integration is enabled and ready for overlay automation.',
          }
        : { level: 'warn', title: 'vMix automation disabled', detail: 'Overlay output is available, but automatic vMix control is not enabled.' },
    );

    if (input.lastSensorAt) {
      const secondsAgo = Math.max(0, Math.round((Date.now() - Date.parse(input.lastSensorAt)) / 1000));
      items.push({
        level: secondsAgo > 60 ? 'warn' : 'ok',
        title: 'Latest sensor activity',
        detail: `Most recent sensor message arrived ${secondsAgo}s ago.`,
      });
    }

    return items;
  }
}
