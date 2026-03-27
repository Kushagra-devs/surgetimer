export type LiveTimerSnapshot = {
  state: string;
  context: {
    warmupStartedAt?: string | null;
    mainStartedAt?: string | null;
    mainEndsAt?: string | null;
    completedAt?: string | null;
    pausedAt?: string | null;
  };
};

const DEFAULT_WARMUP_MS = 45_000;

export function getDisplayTimerMs(snapshot: LiveTimerSnapshot | null, fallbackElapsedMs = 0, now = Date.now()): number {
  if (!snapshot) {
    return fallbackElapsedMs;
  }

  const warmupStartedAt = snapshot.context.warmupStartedAt ? Date.parse(snapshot.context.warmupStartedAt) : null;
  const mainStartedAt = snapshot.context.mainStartedAt ? Date.parse(snapshot.context.mainStartedAt) : null;
  const mainEndsAt = snapshot.context.mainEndsAt ? Date.parse(snapshot.context.mainEndsAt) : null;
  const completedAt = snapshot.context.completedAt ? Date.parse(snapshot.context.completedAt) : null;
  const pausedAt = snapshot.context.pausedAt ? Date.parse(snapshot.context.pausedAt) : null;

  if ((snapshot.state === 'WARMUP_RUNNING' || snapshot.state === 'WARMUP_PAUSED') && warmupStartedAt) {
    const effectiveNow = snapshot.state === 'WARMUP_PAUSED' && pausedAt ? pausedAt : now;
    const elapsed = Math.max(0, effectiveNow - warmupStartedAt);
    return Math.max(0, DEFAULT_WARMUP_MS - elapsed);
  }

  if ((snapshot.state === 'ROUND_RUNNING' || snapshot.state === 'ROUND_PAUSED' || snapshot.state === 'HOLD') && mainStartedAt) {
    const effectiveNow = (snapshot.state === 'ROUND_PAUSED' || snapshot.state === 'HOLD') && pausedAt ? pausedAt : now;
    return Math.max(0, effectiveNow - mainStartedAt);
  }

  if (snapshot.state === 'COMPLETED' && mainStartedAt && (completedAt || mainEndsAt)) {
    return Math.max(0, (completedAt ?? mainEndsAt ?? now) - mainStartedAt);
  }

  return fallbackElapsedMs;
}

export function formatDisplayTimer(snapshot: LiveTimerSnapshot | null, elapsedMs: number, now = Date.now()): string {
  const value = getDisplayTimerMs(snapshot, elapsedMs, now);
  return (Math.max(0, value) / 1000).toFixed(2);
}

export function getTimerLabel(state: string | undefined): string {
  if (state === 'WARMUP_RUNNING' || state === 'WARMUP_PAUSED') {
    return 'Warm-up Countdown';
  }
  if (state === 'ROUND_RUNNING' || state === 'ROUND_PAUSED' || state === 'HOLD') {
    return 'Round Time';
  }
  if (state === 'COMPLETED') {
    return 'Final Time';
  }
  return 'Timer';
}
