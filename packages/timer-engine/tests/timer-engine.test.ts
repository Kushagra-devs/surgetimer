import { describe, expect, it } from 'vitest';
import {
  createInitialSnapshot,
  defaultTimerConfig,
  getElapsedMs,
  getRemainingWarmupMs,
  reduceTimingEvent,
  type TimerConfig,
} from '../src';

const config: TimerConfig = {
  ...defaultTimerConfig,
  sensorDebounceMs: 250,
};

describe('timer engine', () => {
  it('arms a competitor and moves to READY', () => {
    const result = reduceTimingEvent(createInitialSnapshot(), {
      type: 'COMPETITOR_ARMED',
      competitorId: 'entry-1',
      userId: 'judge-1',
      at: '2026-03-27T10:00:00.000Z',
    });

    expect(result.accepted).toBe(true);
    expect(result.snapshot.state).toBe('READY');
    expect(result.snapshot.context.competitorId).toBe('entry-1');
  });

  it('starts warmup on first sequential trigger and main timer on second', () => {
    const armed = reduceTimingEvent(createInitialSnapshot(), {
      type: 'COMPETITOR_ARMED',
      competitorId: 'entry-1',
      userId: 'judge-1',
      at: '2026-03-27T10:00:00.000Z',
    }).snapshot;

    const warmup = reduceTimingEvent(
      armed,
      {
        type: 'SENSOR_TRIGGER',
        channel: 'C0',
        rawPayload: 'TRIG C0',
        at: '2026-03-27T10:00:05.000Z',
      },
      config,
    );

    expect(warmup.snapshot.state).toBe('WARMUP_RUNNING');

    const round = reduceTimingEvent(
      warmup.snapshot,
      {
        type: 'SENSOR_TRIGGER',
        channel: 'C0',
        rawPayload: 'TRIG C0',
        at: '2026-03-27T10:00:06.000Z',
      },
      config,
    );

    expect(round.snapshot.state).toBe('ROUND_RUNNING');
    expect(round.snapshot.context.mainStartedAt).toBe('2026-03-27T10:00:06.000Z');
  });

  it('debounces duplicate triggers', () => {
    const armed = reduceTimingEvent(createInitialSnapshot(), {
      type: 'COMPETITOR_ARMED',
      competitorId: 'entry-1',
      userId: 'judge-1',
      at: '2026-03-27T10:00:00.000Z',
    }).snapshot;

    const first = reduceTimingEvent(
      armed,
      {
        type: 'SENSOR_TRIGGER',
        channel: 'C0',
        rawPayload: 'TRIG C0',
        at: '2026-03-27T10:00:05.000Z',
      },
      config,
    );

    const second = reduceTimingEvent(
      first.snapshot,
      {
        type: 'SENSOR_TRIGGER',
        channel: 'C0',
        rawPayload: 'TRIG C0',
        at: '2026-03-27T10:00:05.100Z',
      },
      config,
    );

    expect(second.accepted).toBe(false);
    expect(second.reason).toBe('Duplicate trigger');
    expect(second.snapshot.state).toBe('WARMUP_RUNNING');
  });

  it('finishes a run from a finish trigger', () => {
    const running = reduceTimingEvent(
      reduceTimingEvent(
        reduceTimingEvent(createInitialSnapshot(), {
          type: 'COMPETITOR_ARMED',
          competitorId: 'entry-1',
          userId: 'judge-1',
          at: '2026-03-27T10:00:00.000Z',
        }).snapshot,
        {
          type: 'MANUAL_WARMUP_START',
          userId: 'judge-1',
          at: '2026-03-27T10:00:05.000Z',
        },
      ).snapshot,
      {
        type: 'MANUAL_MAIN_START',
        userId: 'judge-1',
        at: '2026-03-27T10:00:10.000Z',
      },
      config,
    ).snapshot;

    const completed = reduceTimingEvent(running, {
      type: 'FINISH_TRIGGER',
      channel: 'C2',
      rawPayload: 'FINISH',
      at: '2026-03-27T10:00:21.250Z',
    });

    expect(completed.snapshot.state).toBe('COMPLETED');
    expect(completed.snapshot.context.finishReason).toBe('FINISH_TRIGGER');
  });

  it('supports manual override when hardware is unavailable', () => {
    const ready = reduceTimingEvent(createInitialSnapshot(), {
      type: 'COMPETITOR_ARMED',
      competitorId: 'entry-1',
      userId: 'judge-1',
      at: '2026-03-27T10:00:00.000Z',
    }).snapshot;

    const running = reduceTimingEvent(
      reduceTimingEvent(
        ready,
        {
          type: 'MANUAL_WARMUP_START',
          userId: 'judge-1',
          at: '2026-03-27T10:00:05.000Z',
        },
        config,
      ).snapshot,
      {
        type: 'MANUAL_MAIN_START',
        userId: 'judge-1',
        at: '2026-03-27T10:00:15.000Z',
      },
      config,
    ).snapshot;

    const stopped = reduceTimingEvent(running, {
      type: 'MANUAL_STOP',
      userId: 'judge-1',
      at: '2026-03-27T10:00:25.500Z',
    });

    expect(stopped.snapshot.state).toBe('COMPLETED');
    expect(stopped.snapshot.context.manualOverrideUsed).toBe(true);
    expect(stopped.snapshot.context.finishReason).toBe('MANUAL_STOP');
  });

  it('computes elapsed and remaining values from timestamps', () => {
    const running = reduceTimingEvent(
      reduceTimingEvent(createInitialSnapshot(), {
        type: 'COMPETITOR_ARMED',
        competitorId: 'entry-1',
        userId: 'judge-1',
        at: '2026-03-27T10:00:00.000Z',
      }).snapshot,
      {
        type: 'MANUAL_MAIN_START',
        userId: 'judge-1',
        at: '2026-03-27T10:00:05.000Z',
      },
      config,
    ).snapshot;

    expect(getElapsedMs(running, '2026-03-27T10:00:07.500Z')).toBe(2500);

    const warmup = reduceTimingEvent(
      reduceTimingEvent(createInitialSnapshot(), {
        type: 'COMPETITOR_ARMED',
        competitorId: 'entry-2',
        userId: 'judge-1',
        at: '2026-03-27T10:00:00.000Z',
      }).snapshot,
      {
        type: 'MANUAL_WARMUP_START',
        userId: 'judge-1',
        at: '2026-03-27T10:00:10.000Z',
      },
      config,
    ).snapshot;

    expect(getRemainingWarmupMs(warmup, config, '2026-03-27T10:00:20.000Z')).toBe(35000);
  });

  it('freezes elapsed and remaining timers while paused, then resumes without drift', () => {
    const running = reduceTimingEvent(
      reduceTimingEvent(createInitialSnapshot(), {
        type: 'COMPETITOR_ARMED',
        competitorId: 'entry-1',
        userId: 'judge-1',
        at: '2026-03-27T10:00:00.000Z',
      }).snapshot,
      {
        type: 'MANUAL_MAIN_START',
        userId: 'judge-1',
        at: '2026-03-27T10:00:05.000Z',
      },
      config,
    ).snapshot;

    const pausedRound = reduceTimingEvent(running, {
      type: 'PAUSE',
      userId: 'judge-1',
      at: '2026-03-27T10:00:10.000Z',
    }).snapshot;

    expect(getElapsedMs(pausedRound, '2026-03-27T10:00:14.000Z')).toBe(5000);

    const resumedRound = reduceTimingEvent(pausedRound, {
      type: 'RESUME',
      userId: 'judge-1',
      at: '2026-03-27T10:00:14.000Z',
    }).snapshot;

    expect(getElapsedMs(resumedRound, '2026-03-27T10:00:15.000Z')).toBe(6000);

    const warmup = reduceTimingEvent(
      reduceTimingEvent(createInitialSnapshot(), {
        type: 'COMPETITOR_ARMED',
        competitorId: 'entry-2',
        userId: 'judge-1',
        at: '2026-03-27T10:00:00.000Z',
      }).snapshot,
      {
        type: 'MANUAL_WARMUP_START',
        userId: 'judge-1',
        at: '2026-03-27T10:00:10.000Z',
      },
      config,
    ).snapshot;

    const pausedWarmup = reduceTimingEvent(warmup, {
      type: 'PAUSE',
      userId: 'judge-1',
      at: '2026-03-27T10:00:15.000Z',
    }).snapshot;

    expect(getRemainingWarmupMs(pausedWarmup, config, '2026-03-27T10:00:20.000Z')).toBe(40000);
  });
});
