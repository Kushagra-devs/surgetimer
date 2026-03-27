import {
  type ReducerResult,
  type TimerConfig,
  TimerState,
  type TimerSnapshot,
  type TimingContext,
  type TimingEffect,
  type TimingEvent,
} from '@horse-timer/types';

export { TimerState };
export type { TimerConfig } from '@horse-timer/types';

const ACTIVE_STATES = new Set<TimerState>([
  TimerState.WARMUP_RUNNING,
  TimerState.WARMUP_PAUSED,
  TimerState.ROUND_RUNNING,
  TimerState.ROUND_PAUSED,
  TimerState.HOLD,
]);

const MANUAL_MAIN_START_STATES: TimerState[] = [TimerState.READY, TimerState.WARMUP_RUNNING, TimerState.WARMUP_PAUSED];

export const defaultTimerConfig: TimerConfig = {
  sensorDebounceMs: 250,
  warmupDurationSec: 45,
  maxRoundDurationSec: 300,
  mode: 'SEQUENTIAL_GENERIC',
  startSensor: 'C0',
  mainStartSensor: 'C1',
  finishSensor: 'C2',
};

export function createInitialSnapshot(): TimerSnapshot {
  return {
    state: TimerState.IDLE,
    context: {
      competitorId: null,
      armedByUserId: null,
      armedAt: null,
      triggerCount: 0,
      warmupStartedAt: null,
      warmupEndsAt: null,
      mainStartedAt: null,
      mainEndsAt: null,
      completedAt: null,
      pausedAt: null,
      abortReason: null,
      manualOverrideUsed: false,
      lastTriggerByChannel: {},
      lastSensorMessage: null,
      finishReason: null,
      warnings: [],
    },
  };
}

function cloneContext(context: TimingContext): TimingContext {
  return {
    ...context,
    lastTriggerByChannel: { ...context.lastTriggerByChannel },
    warnings: [...context.warnings],
  };
}

function accepted(snapshot: TimerSnapshot, effects: TimingEffect[] = []): ReducerResult {
  return { snapshot, accepted: true, effects };
}

function ignored(snapshot: TimerSnapshot, reason: string, effects: TimingEffect[] = []): ReducerResult {
  return { snapshot, accepted: false, reason, effects };
}

function withWarning(snapshot: TimerSnapshot, message: string): TimerSnapshot {
  return {
    ...snapshot,
    context: {
      ...snapshot.context,
      warnings: [...snapshot.context.warnings, message],
    },
  };
}

function toMillis(iso: string): number {
  return new Date(iso).getTime();
}

function isDuplicate(channel: string, at: string, snapshot: TimerSnapshot, config: TimerConfig): boolean {
  const previous = snapshot.context.lastTriggerByChannel[channel];
  if (!previous) {
    return false;
  }
  return toMillis(at) - toMillis(previous) < config.sensorDebounceMs;
}

function setLastTrigger(snapshot: TimerSnapshot, channel: string, at: string, rawPayload: string): TimerSnapshot {
  return {
    ...snapshot,
    context: {
      ...snapshot.context,
      lastTriggerByChannel: {
        ...snapshot.context.lastTriggerByChannel,
        [channel]: at,
      },
      lastSensorMessage: {
        channel,
        at,
        rawPayload,
      },
    },
  };
}

function startWarmup(snapshot: TimerSnapshot, at: string, manualOverrideUsed = false): TimerSnapshot {
  return {
    state: TimerState.WARMUP_RUNNING,
    context: {
      ...snapshot.context,
      triggerCount: snapshot.context.triggerCount + 1,
      warmupStartedAt: at,
      warmupEndsAt: null,
      pausedAt: null,
      manualOverrideUsed,
      finishReason: null,
      warnings: [],
    },
  };
}

function startMain(snapshot: TimerSnapshot, at: string, config: TimerConfig, manualOverrideUsed = false): TimerSnapshot {
  return {
    state: TimerState.ROUND_RUNNING,
    context: {
      ...snapshot.context,
      triggerCount: Math.max(snapshot.context.triggerCount + 1, 2),
      warmupEndsAt: at,
      mainStartedAt: at,
      mainEndsAt: new Date(toMillis(at) + config.maxRoundDurationSec * 1000).toISOString(),
      pausedAt: null,
      manualOverrideUsed,
      finishReason: null,
    },
  };
}

function completeRun(
  snapshot: TimerSnapshot,
  at: string,
  reason: NonNullable<TimingContext['finishReason']>,
  manualOverrideUsed = false,
): TimerSnapshot {
  return {
    state: TimerState.COMPLETED,
    context: {
      ...snapshot.context,
      completedAt: at,
      mainEndsAt: at,
      pausedAt: null,
      finishReason: reason,
      manualOverrideUsed: snapshot.context.manualOverrideUsed || manualOverrideUsed,
    },
  };
}

function resumeFromPause(snapshot: TimerSnapshot, at: string, nextState: TimerState): TimerSnapshot {
  if (!snapshot.context.pausedAt) {
    return {
      ...snapshot,
      state: nextState,
      context: {
        ...snapshot.context,
        pausedAt: null,
        manualOverrideUsed: true,
      },
    };
  }

  const pauseDurationMs = Math.max(0, toMillis(at) - toMillis(snapshot.context.pausedAt));
  const nextWarmupStartedAt = snapshot.context.warmupStartedAt
    ? new Date(toMillis(snapshot.context.warmupStartedAt) + pauseDurationMs).toISOString()
    : null;
  const nextMainStartedAt = snapshot.context.mainStartedAt
    ? new Date(toMillis(snapshot.context.mainStartedAt) + pauseDurationMs).toISOString()
    : null;
  const nextMainEndsAt = snapshot.context.mainEndsAt
    ? new Date(toMillis(snapshot.context.mainEndsAt) + pauseDurationMs).toISOString()
    : null;

  return {
    ...snapshot,
    state: nextState,
    context: {
      ...snapshot.context,
      warmupStartedAt: nextWarmupStartedAt,
      mainStartedAt: nextMainStartedAt,
      mainEndsAt: nextMainEndsAt,
      pausedAt: null,
      manualOverrideUsed: true,
    },
  };
}

function canAbort(state: TimerState): boolean {
  return ACTIVE_STATES.has(state) || state === TimerState.READY;
}

export function reduceTimingEvent(
  current: TimerSnapshot,
  event: TimingEvent,
  config: TimerConfig = defaultTimerConfig,
): ReducerResult {
  let snapshot = current;
  const effects: TimingEffect[] = [];

  switch (event.type) {
    case 'COMPETITOR_ARMED': {
      const next = createInitialSnapshot();
      next.state = TimerState.READY;
      next.context.competitorId = event.competitorId;
      next.context.armedByUserId = event.userId;
      next.context.armedAt = event.at;
      return accepted(next, [{ type: 'LOG', level: 'info', message: 'Competitor armed.' }]);
    }
    case 'SENSOR_TRIGGER': {
      if (snapshot.state === TimerState.IDLE) {
        return ignored(withWarning(snapshot, 'Sensor trigger ignored while idle.'), 'Not armed', [
          { type: 'LOG', level: 'warn', message: 'Trigger ignored while system idle.' },
        ]);
      }
      if (isDuplicate(event.channel, event.at, snapshot, config)) {
        return ignored(setLastTrigger(snapshot, event.channel, event.at, event.rawPayload), 'Duplicate trigger', [
          { type: 'LOG', level: 'warn', message: `Duplicate trigger ignored on ${event.channel}.` },
        ]);
      }

      snapshot = setLastTrigger(snapshot, event.channel, event.at, event.rawPayload);
      if (config.mode === 'SEQUENTIAL_GENERIC') {
        if (snapshot.state === TimerState.READY) {
          const next = startWarmup(snapshot, event.at);
          effects.push({ type: 'TIMER_STARTED', timer: 'WARMUP', at: event.at });
          return accepted(next, effects);
        }
        if (snapshot.state === TimerState.WARMUP_RUNNING || snapshot.state === TimerState.WARMUP_PAUSED) {
          const next = startMain(snapshot, event.at, config);
          effects.push({ type: 'TIMER_STARTED', timer: 'MAIN', at: event.at });
          return accepted(next, effects);
        }
        return ignored(withWarning(snapshot, 'Unexpected trigger for current state.'), 'Invalid trigger for state', [
          { type: 'LOG', level: 'warn', message: 'Unexpected trigger during active state.' },
        ]);
      }

      if (snapshot.state === TimerState.READY && event.channel === config.startSensor) {
        return accepted(startWarmup(snapshot, event.at), [{ type: 'TIMER_STARTED', timer: 'WARMUP', at: event.at }]);
      }
      if (
        (snapshot.state === TimerState.WARMUP_RUNNING || snapshot.state === TimerState.WARMUP_PAUSED) &&
        event.channel === config.mainStartSensor
      ) {
        return accepted(startMain(snapshot, event.at, config), [{ type: 'TIMER_STARTED', timer: 'MAIN', at: event.at }]);
      }
      if (snapshot.state === TimerState.ROUND_RUNNING && event.channel === config.finishSensor) {
        const next = completeRun(snapshot, event.at, 'FINISH_TRIGGER');
        effects.push({ type: 'RUN_COMPLETED', at: event.at, reason: 'FINISH_TRIGGER' });
        return accepted(next, effects);
      }
      return ignored(withWarning(snapshot, `Unmapped trigger on ${event.channel}.`), 'Unmapped channel');
    }
    case 'MANUAL_WARMUP_START': {
      if (snapshot.state !== TimerState.READY) {
        return ignored(snapshot, 'Manual warm-up start requires READY state');
      }
      return accepted(startWarmup(snapshot, event.at, true), [{ type: 'TIMER_STARTED', timer: 'WARMUP', at: event.at }]);
    }
    case 'MANUAL_MAIN_START': {
      if (!MANUAL_MAIN_START_STATES.includes(snapshot.state)) {
        return ignored(snapshot, 'Manual main start requires READY or WARMUP state');
      }
      return accepted(startMain(snapshot, event.at, config, true), [{ type: 'TIMER_STARTED', timer: 'MAIN', at: event.at }]);
    }
    case 'FINISH_TRIGGER': {
      if (snapshot.state !== TimerState.ROUND_RUNNING) {
        return ignored(withWarning(snapshot, 'Finish trigger ignored outside round.'), 'Not in round');
      }
      const next = completeRun(snapshot, event.at, 'FINISH_TRIGGER');
      effects.push({ type: 'RUN_COMPLETED', at: event.at, reason: 'FINISH_TRIGGER' });
      return accepted(next, effects);
    }
    case 'MANUAL_STOP': {
      if (snapshot.state !== TimerState.ROUND_RUNNING) {
        return ignored(snapshot, 'Manual stop requires ROUND_RUNNING state');
      }
      const next = completeRun(snapshot, event.at, 'MANUAL_STOP', true);
      effects.push({ type: 'RUN_COMPLETED', at: event.at, reason: 'MANUAL_STOP' });
      return accepted(next, effects);
    }
    case 'PAUSE': {
      if (snapshot.state === TimerState.WARMUP_RUNNING) {
        return accepted(
          {
            ...snapshot,
            state: TimerState.WARMUP_PAUSED,
            context: { ...snapshot.context, pausedAt: event.at, manualOverrideUsed: true },
          },
          [{ type: 'TIMER_PAUSED', timer: 'WARMUP', at: event.at }],
        );
      }
      if (snapshot.state === TimerState.ROUND_RUNNING) {
        return accepted(
          {
            ...snapshot,
            state: TimerState.ROUND_PAUSED,
            context: { ...snapshot.context, pausedAt: event.at, manualOverrideUsed: true },
          },
          [{ type: 'TIMER_PAUSED', timer: 'MAIN', at: event.at }],
        );
      }
      return ignored(snapshot, 'Pause only valid while running');
    }
    case 'RESUME': {
      if (snapshot.state === TimerState.WARMUP_PAUSED) {
        return accepted(
          resumeFromPause(snapshot, event.at, TimerState.WARMUP_RUNNING),
          [{ type: 'TIMER_RESUMED', timer: 'WARMUP', at: event.at }],
        );
      }
      if (snapshot.state === TimerState.ROUND_PAUSED || snapshot.state === TimerState.HOLD) {
        return accepted(
          resumeFromPause(snapshot, event.at, TimerState.ROUND_RUNNING),
          [{ type: 'TIMER_RESUMED', timer: 'MAIN', at: event.at }],
        );
      }
      return ignored(snapshot, 'Resume only valid while paused or hold');
    }
    case 'RESET': {
      return accepted(createInitialSnapshot(), [{ type: 'LOG', level: 'info', message: 'System reset.' }]);
    }
    case 'ABORT': {
      if (!canAbort(snapshot.state)) {
        return ignored(snapshot, 'Abort not allowed in current state');
      }
      return accepted({
        state: TimerState.ABORTED,
        context: {
          ...snapshot.context,
          abortReason: event.reason ?? 'No reason provided',
          completedAt: event.at,
          pausedAt: null,
          manualOverrideUsed: true,
        },
      });
    }
    case 'MAX_TIME_REACHED': {
      if (snapshot.state !== TimerState.ROUND_RUNNING) {
        return ignored(snapshot, 'Max time event ignored outside round');
      }
      return accepted(completeRun(snapshot, event.at, 'MAX_TIME_REACHED'), [
        { type: 'RUN_COMPLETED', at: event.at, reason: 'MAX_TIME_REACHED' },
      ]);
    }
    default: {
      const exhaustive: never = event;
      return exhaustive;
    }
  }
}

export function getElapsedMs(snapshot: TimerSnapshot, nowIso: string): number {
  if (snapshot.state === TimerState.ROUND_RUNNING || snapshot.state === TimerState.ROUND_PAUSED || snapshot.state === TimerState.HOLD) {
    if (!snapshot.context.mainStartedAt) {
      return 0;
    }
    const effectiveNow = snapshot.state === TimerState.ROUND_PAUSED || snapshot.state === TimerState.HOLD
      ? snapshot.context.pausedAt ?? nowIso
      : nowIso;
    return Math.max(0, toMillis(effectiveNow) - toMillis(snapshot.context.mainStartedAt));
  }

  if (snapshot.context.mainStartedAt && snapshot.context.mainEndsAt) {
    return Math.max(0, toMillis(snapshot.context.mainEndsAt) - toMillis(snapshot.context.mainStartedAt));
  }

  return 0;
}

export function getRemainingWarmupMs(snapshot: TimerSnapshot, config: TimerConfig, nowIso: string): number {
  if (!snapshot.context.warmupStartedAt) {
    return config.warmupDurationSec * 1000;
  }
  const effectiveNow = snapshot.state === TimerState.WARMUP_PAUSED ? snapshot.context.pausedAt ?? nowIso : nowIso;
  const elapsed = Math.max(0, toMillis(effectiveNow) - toMillis(snapshot.context.warmupStartedAt));
  return Math.max(0, config.warmupDurationSec * 1000 - elapsed);
}
