import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { addAudit, demoStore } from '../common/demo-store';
import { RuntimeStateService } from '../persistence/runtime-state.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { SettingsService } from '../settings/settings.service';
import { VmixService } from '../vmix/vmix.service';
import {
  createInitialSnapshot,
  getElapsedMs,
  reduceTimingEvent,
} from '@horse-timer/timer-engine';
import {
  TimerState,
  type PublicRunHistoryEntry,
  type RunEventTrailEntry,
  type TimerConfig,
  type TimerSnapshot,
  type TimingEvent,
} from '@horse-timer/types';

@Injectable()
export class TimingService implements OnModuleInit {
  private snapshot: TimerSnapshot = createInitialSnapshot();
  private activeClassId = 'class-demo';
  private currentIndex = 0;
  private runHistory: PublicRunHistoryEntry[] = [];
  private currentRunEvents: RunEventTrailEntry[] = [];

  constructor(
    @Inject(RealtimeGateway) private readonly realtimeGateway: RealtimeGateway,
    @Inject(SettingsService) private readonly settingsService: SettingsService,
    @Inject(VmixService) private readonly vmixService: VmixService,
    @Inject(RuntimeStateService) private readonly runtimeStateService: RuntimeStateService,
  ) {}

  async onModuleInit() {
    await this.reloadFromPersistence();
  }

  async reloadFromPersistence() {
    const saved = await this.runtimeStateService.loadRuntimeState();
    if (!saved) {
      this.snapshot = createInitialSnapshot();
      this.activeClassId = 'class-demo';
      this.currentIndex = 0;
      this.runHistory = [];
      this.currentRunEvents = [];
      this.broadcastCurrentState();
      return this.getState();
    }
    this.snapshot = saved.snapshot;
    this.activeClassId = saved.activeClassId;
    this.currentIndex = saved.currentIndex;
    this.runHistory = (saved.runHistory as PublicRunHistoryEntry[] | undefined) ?? [];
    this.currentRunEvents = (saved.currentRunEvents as RunEventTrailEntry[] | undefined) ?? [];
    this.broadcastCurrentState();
    return this.getState();
  }

  getState() {
    return {
      snapshot: this.snapshot,
      elapsedMs: getElapsedMs(this.snapshot, new Date().toISOString()),
      competitor: this.getActiveCompetitor(),
    };
  }

  getActiveRun() {
    return this.getState();
  }

  armCompetitor(competitorEntryId: string, userId = 'operator-demo') {
    addAudit('COMPETITOR_ARMED', 'RUN', competitorEntryId, userId);
    return this.apply({
      type: 'COMPETITOR_ARMED',
      competitorId: competitorEntryId,
      userId,
      at: new Date().toISOString(),
    });
  }

  manualWarmupStart(userId = 'judge-demo') {
    addAudit('MANUAL_WARMUP_START', 'RUN', this.snapshot.context.competitorId ?? 'unassigned', userId);
    return this.apply({ type: 'MANUAL_WARMUP_START', userId, at: new Date().toISOString() });
  }

  manualMainStart(userId = 'judge-demo') {
    addAudit('MANUAL_MAIN_START', 'RUN', this.snapshot.context.competitorId ?? 'unassigned', userId);
    return this.apply({ type: 'MANUAL_MAIN_START', userId, at: new Date().toISOString() });
  }

  manualStop(userId = 'judge-demo') {
    addAudit('MANUAL_STOP', 'RUN', this.snapshot.context.competitorId ?? 'unassigned', userId);
    return this.apply({ type: 'MANUAL_STOP', userId, at: new Date().toISOString() });
  }

  pause(userId = 'judge-demo') {
    addAudit('PAUSE', 'RUN', this.snapshot.context.competitorId ?? 'unassigned', userId);
    return this.apply({ type: 'PAUSE', userId, at: new Date().toISOString() });
  }

  resume(userId = 'judge-demo') {
    addAudit('RESUME', 'RUN', this.snapshot.context.competitorId ?? 'unassigned', userId);
    return this.apply({ type: 'RESUME', userId, at: new Date().toISOString() });
  }

  reset(userId = 'judge-demo') {
    addAudit('RESET', 'RUN', this.snapshot.context.competitorId ?? 'unassigned', userId);
    return this.apply({ type: 'RESET', userId, at: new Date().toISOString() });
  }

  abort(userId = 'judge-demo', reason = 'Manual abort') {
    addAudit('ABORT', 'RUN', this.snapshot.context.competitorId ?? 'unassigned', userId);
    return this.apply({ type: 'ABORT', userId, at: new Date().toISOString(), reason });
  }

  registerSensorTrigger(channel: string, rawPayload: string, at = new Date().toISOString()) {
    const config = this.getTimerConfig();
    const event: TimingEvent =
      this.snapshot.state === TimerState.ROUND_RUNNING && channel === config.finishSensor
        ? { type: 'FINISH_TRIGGER', channel, rawPayload, at }
        : { type: 'SENSOR_TRIGGER', channel, rawPayload, at };

    return this.apply(event);
  }

  advanceQueue() {
    this.currentIndex = (this.currentIndex + 1) % demoStore.competitors.length;
    const competitor = this.getActiveCompetitor();
    if (competitor) {
      return this.armCompetitor(competitor.id);
    }
    return this.getState();
  }

  getRunHistory() {
    return this.runHistory;
  }

  updateRunResult(runId: string, body: { penalties?: number; resultCode?: string; notes?: string }) {
    const run = this.runHistory.find((item) => item.id === runId);
    if (!run) {
      return null;
    }

    run.penalties = body.penalties ?? run.penalties ?? 0;
    run.resultCode = body.resultCode ?? run.resultCode ?? 'PENDING_REVIEW';
    run.notes = body.notes ?? run.notes ?? '';
    addAudit('RUN_RESULT_UPDATED', 'RUN', runId);

    void this.runtimeStateService.saveRuntimeState({
      activeClassId: this.activeClassId,
      currentIndex: this.currentIndex,
      snapshot: this.snapshot,
      runHistory: this.runHistory,
      currentRunEvents: this.currentRunEvents,
    });

    return run;
  }

  getLiveHistory() {
    return {
      snapshot: this.snapshot,
      elapsedMs: getElapsedMs(this.snapshot, new Date().toISOString()),
      competitor: this.getActiveCompetitor(),
      eventTrail: this.currentRunEvents,
    };
  }

  private getActiveCompetitor() {
    return demoStore.competitors[this.currentIndex] ?? null;
  }

  private getTimerConfig(): TimerConfig {
    return {
      sensorDebounceMs: demoStore.settings.sensorDebounceMs,
      warmupDurationSec: demoStore.settings.warmupDurationSec,
      maxRoundDurationSec: demoStore.settings.maxRoundDurationSec,
      mode: demoStore.settings.timerMode,
      startSensor: demoStore.settings.startSensor,
      mainStartSensor: demoStore.settings.mainStartSensor,
      finishSensor: demoStore.settings.finishSensor,
    };
  }

  private apply(event: TimingEvent) {
    const previousState = this.snapshot.state;
    const result = reduceTimingEvent(this.snapshot, event, this.getTimerConfig());
    this.snapshot = result.snapshot;
    const appliedAt = 'at' in event ? event.at : new Date().toISOString();
    const competitor = this.getActiveCompetitor();

    if (event.type === 'COMPETITOR_ARMED') {
      this.currentRunEvents = [];
    }

    const trailEntry: RunEventTrailEntry = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      at: appliedAt,
      eventType: event.type,
      previousState,
      nextState: this.snapshot.state,
      accepted: result.accepted,
      reason: result.reason ?? null,
    };

    this.currentRunEvents.push(trailEntry);

    const payload = this.getState();
    this.realtimeGateway.broadcast('timing.state.updated', payload);
    this.realtimeGateway.broadcast('overlay.updated', payload);
    void this.vmixService.syncState(this.snapshot.state, `${(payload.elapsedMs / 1000).toFixed(2)}s`);

    if (this.snapshot.state === TimerState.COMPLETED || this.snapshot.state === TimerState.ABORTED) {
      this.runHistory.unshift({
        id: `run-${Date.now()}`,
        eventId: demoStore.classes.find((item) => item.id === (competitor?.classId ?? this.activeClassId))?.eventId ?? 'event-demo',
        classId: competitor?.classId ?? this.activeClassId,
        competitor: this.getActiveCompetitor(),
        snapshot: this.snapshot,
        elapsedMs: getElapsedMs(this.snapshot, new Date().toISOString()),
        state: this.snapshot.state,
        penalties: 0,
        resultCode: this.snapshot.state === TimerState.COMPLETED ? 'FINISHED' : 'ABORTED',
        notes: '',
        armedAt: this.snapshot.context.armedAt,
        warmupStartedAt: this.snapshot.context.warmupStartedAt,
        mainStartedAt: this.snapshot.context.mainStartedAt,
        mainEndedAt: this.snapshot.context.completedAt ?? this.snapshot.context.mainEndsAt,
        finishReason: this.snapshot.context.finishReason,
        manualOverrideUsed: this.snapshot.context.manualOverrideUsed,
        warnings: this.snapshot.context.warnings,
        eventTrail: [...this.currentRunEvents],
      });
      this.realtimeGateway.broadcast('run.completed', this.runHistory[0]);
      this.currentRunEvents = [];
    }

    void this.runtimeStateService.saveRuntimeState({
      activeClassId: this.activeClassId,
      currentIndex: this.currentIndex,
      snapshot: this.snapshot,
      runHistory: this.runHistory,
      currentRunEvents: this.currentRunEvents,
    });

    return {
      ...payload,
      accepted: result.accepted,
      reason: result.reason,
      effects: result.effects,
    };
  }

  private broadcastCurrentState() {
    const payload = this.getState();
    this.realtimeGateway.broadcast('timing.state.updated', payload);
    this.realtimeGateway.broadcast('overlay.updated', payload);
  }
}
