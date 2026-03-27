export function formatTimer(elapsedMs: number): string {
  const totalSeconds = Math.max(0, elapsedMs) / 1000;
  return totalSeconds.toFixed(2);
}

