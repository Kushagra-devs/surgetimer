"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultTimerConfig = void 0;
exports.createInitialSnapshot = createInitialSnapshot;
exports.reduceTimingEvent = reduceTimingEvent;
exports.getElapsedMs = getElapsedMs;
exports.getRemainingWarmupMs = getRemainingWarmupMs;
const types_1 = require("@horse-timer/types");
const ACTIVE_STATES = new Set([
    types_1.TimerState.WARMUP_RUNNING,
    types_1.TimerState.WARMUP_PAUSED,
    types_1.TimerState.ROUND_RUNNING,
    types_1.TimerState.ROUND_PAUSED,
    types_1.TimerState.HOLD,
]);
exports.defaultTimerConfig = {
    sensorDebounceMs: 250,
    warmupDurationSec: 45,
    maxRoundDurationSec: 300,
    mode: 'SEQUENTIAL_GENERIC',
    startSensor: 'C0',
    mainStartSensor: 'C1',
    finishSensor: 'C2',
};
function createInitialSnapshot() {
    return {
        state: types_1.TimerState.IDLE,
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
function cloneContext(context) {
    return {
        ...context,
        lastTriggerByChannel: { ...context.lastTriggerByChannel },
        warnings: [...context.warnings],
    };
}
function accepted(snapshot, effects = []) {
    return { snapshot, accepted: true, effects };
}
function ignored(snapshot, reason, effects = []) {
    return { snapshot, accepted: false, reason, effects };
}
function withWarning(snapshot, message) {
    return {
        ...snapshot,
        context: {
            ...snapshot.context,
            warnings: [...snapshot.context.warnings, message],
        },
    };
}
function toMillis(iso) {
    return new Date(iso).getTime();
}
function isDuplicate(channel, at, snapshot, config) {
    const previous = snapshot.context.lastTriggerByChannel[channel];
    if (!previous) {
        return false;
    }
    return toMillis(at) - toMillis(previous) < config.sensorDebounceMs;
}
function setLastTrigger(snapshot, channel, at, rawPayload) {
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
function startWarmup(snapshot, at, manualOverrideUsed = false) {
    return {
        state: types_1.TimerState.WARMUP_RUNNING,
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
function startMain(snapshot, at, config, manualOverrideUsed = false) {
    return {
        state: types_1.TimerState.ROUND_RUNNING,
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
function completeRun(snapshot, at, reason, manualOverrideUsed = false) {
    return {
        state: types_1.TimerState.COMPLETED,
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
function resumeFromPause(snapshot, at, nextState) {
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
function canAbort(state) {
    return ACTIVE_STATES.has(state) || state === types_1.TimerState.READY;
}
function reduceTimingEvent(current, event, config = exports.defaultTimerConfig) {
    let snapshot = current;
    const effects = [];
    switch (event.type) {
        case 'COMPETITOR_ARMED': {
            const next = createInitialSnapshot();
            next.state = types_1.TimerState.READY;
            next.context.competitorId = event.competitorId;
            next.context.armedByUserId = event.userId;
            next.context.armedAt = event.at;
            return accepted(next, [{ type: 'LOG', level: 'info', message: 'Competitor armed.' }]);
        }
        case 'SENSOR_TRIGGER': {
            if (snapshot.state === types_1.TimerState.IDLE) {
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
                if (snapshot.state === types_1.TimerState.READY) {
                    const next = startWarmup(snapshot, event.at);
                    effects.push({ type: 'TIMER_STARTED', timer: 'WARMUP', at: event.at });
                    return accepted(next, effects);
                }
                if (snapshot.state === types_1.TimerState.WARMUP_RUNNING || snapshot.state === types_1.TimerState.WARMUP_PAUSED) {
                    const next = startMain(snapshot, event.at, config);
                    effects.push({ type: 'TIMER_STARTED', timer: 'MAIN', at: event.at });
                    return accepted(next, effects);
                }
                return ignored(withWarning(snapshot, 'Unexpected trigger for current state.'), 'Invalid trigger for state', [
                    { type: 'LOG', level: 'warn', message: 'Unexpected trigger during active state.' },
                ]);
            }
            if (snapshot.state === types_1.TimerState.READY && event.channel === config.startSensor) {
                return accepted(startWarmup(snapshot, event.at), [{ type: 'TIMER_STARTED', timer: 'WARMUP', at: event.at }]);
            }
            if ((snapshot.state === types_1.TimerState.WARMUP_RUNNING || snapshot.state === types_1.TimerState.WARMUP_PAUSED) &&
                event.channel === config.mainStartSensor) {
                return accepted(startMain(snapshot, event.at, config), [{ type: 'TIMER_STARTED', timer: 'MAIN', at: event.at }]);
            }
            if (snapshot.state === types_1.TimerState.ROUND_RUNNING && event.channel === config.finishSensor) {
                const next = completeRun(snapshot, event.at, 'FINISH_TRIGGER');
                effects.push({ type: 'RUN_COMPLETED', at: event.at, reason: 'FINISH_TRIGGER' });
                return accepted(next, effects);
            }
            return ignored(withWarning(snapshot, `Unmapped trigger on ${event.channel}.`), 'Unmapped channel');
        }
        case 'MANUAL_WARMUP_START': {
            if (snapshot.state !== types_1.TimerState.READY) {
                return ignored(snapshot, 'Manual warm-up start requires READY state');
            }
            return accepted(startWarmup(snapshot, event.at, true), [{ type: 'TIMER_STARTED', timer: 'WARMUP', at: event.at }]);
        }
        case 'MANUAL_MAIN_START': {
            if (![types_1.TimerState.READY, types_1.TimerState.WARMUP_RUNNING, types_1.TimerState.WARMUP_PAUSED].includes(snapshot.state)) {
                return ignored(snapshot, 'Manual main start requires READY or WARMUP state');
            }
            return accepted(startMain(snapshot, event.at, config, true), [{ type: 'TIMER_STARTED', timer: 'MAIN', at: event.at }]);
        }
        case 'FINISH_TRIGGER': {
            if (snapshot.state !== types_1.TimerState.ROUND_RUNNING) {
                return ignored(withWarning(snapshot, 'Finish trigger ignored outside round.'), 'Not in round');
            }
            const next = completeRun(snapshot, event.at, 'FINISH_TRIGGER');
            effects.push({ type: 'RUN_COMPLETED', at: event.at, reason: 'FINISH_TRIGGER' });
            return accepted(next, effects);
        }
        case 'MANUAL_STOP': {
            if (snapshot.state !== types_1.TimerState.ROUND_RUNNING) {
                return ignored(snapshot, 'Manual stop requires ROUND_RUNNING state');
            }
            const next = completeRun(snapshot, event.at, 'MANUAL_STOP', true);
            effects.push({ type: 'RUN_COMPLETED', at: event.at, reason: 'MANUAL_STOP' });
            return accepted(next, effects);
        }
        case 'PAUSE': {
            if (snapshot.state === types_1.TimerState.WARMUP_RUNNING) {
                return accepted({
                    ...snapshot,
                    state: types_1.TimerState.WARMUP_PAUSED,
                    context: { ...snapshot.context, pausedAt: event.at, manualOverrideUsed: true },
                }, [{ type: 'TIMER_PAUSED', timer: 'WARMUP', at: event.at }]);
            }
            if (snapshot.state === types_1.TimerState.ROUND_RUNNING) {
                return accepted({
                    ...snapshot,
                    state: types_1.TimerState.ROUND_PAUSED,
                    context: { ...snapshot.context, pausedAt: event.at, manualOverrideUsed: true },
                }, [{ type: 'TIMER_PAUSED', timer: 'MAIN', at: event.at }]);
            }
            return ignored(snapshot, 'Pause only valid while running');
        }
        case 'RESUME': {
            if (snapshot.state === types_1.TimerState.WARMUP_PAUSED) {
                return accepted(resumeFromPause(snapshot, event.at, types_1.TimerState.WARMUP_RUNNING), [{ type: 'TIMER_RESUMED', timer: 'WARMUP', at: event.at }]);
            }
            if (snapshot.state === types_1.TimerState.ROUND_PAUSED || snapshot.state === types_1.TimerState.HOLD) {
                return accepted(resumeFromPause(snapshot, event.at, types_1.TimerState.ROUND_RUNNING), [{ type: 'TIMER_RESUMED', timer: 'MAIN', at: event.at }]);
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
                state: types_1.TimerState.ABORTED,
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
            if (snapshot.state !== types_1.TimerState.ROUND_RUNNING) {
                return ignored(snapshot, 'Max time event ignored outside round');
            }
            return accepted(completeRun(snapshot, event.at, 'MAX_TIME_REACHED'), [
                { type: 'RUN_COMPLETED', at: event.at, reason: 'MAX_TIME_REACHED' },
            ]);
        }
        default: {
            const exhaustive = event;
            return exhaustive;
        }
    }
}
function getElapsedMs(snapshot, nowIso) {
    if (snapshot.state === types_1.TimerState.ROUND_RUNNING || snapshot.state === types_1.TimerState.ROUND_PAUSED || snapshot.state === types_1.TimerState.HOLD) {
        if (!snapshot.context.mainStartedAt) {
            return 0;
        }
        const effectiveNow = snapshot.state === types_1.TimerState.ROUND_PAUSED || snapshot.state === types_1.TimerState.HOLD
            ? snapshot.context.pausedAt ?? nowIso
            : nowIso;
        return Math.max(0, toMillis(effectiveNow) - toMillis(snapshot.context.mainStartedAt));
    }
    if (snapshot.context.mainStartedAt && snapshot.context.mainEndsAt) {
        return Math.max(0, toMillis(snapshot.context.mainEndsAt) - toMillis(snapshot.context.mainStartedAt));
    }
    return 0;
}
function getRemainingWarmupMs(snapshot, config, nowIso) {
    if (!snapshot.context.warmupStartedAt) {
        return config.warmupDurationSec * 1000;
    }
    const effectiveNow = snapshot.state === types_1.TimerState.WARMUP_PAUSED ? snapshot.context.pausedAt ?? nowIso : nowIso;
    const elapsed = Math.max(0, toMillis(effectiveNow) - toMillis(snapshot.context.warmupStartedAt));
    return Math.max(0, config.warmupDurationSec * 1000 - elapsed);
}
