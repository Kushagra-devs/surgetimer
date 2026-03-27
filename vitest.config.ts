import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  root: __dirname,
  test: {
    environment: 'node',
    include: [
      path.resolve(__dirname, 'packages/**/*.test.ts'),
      path.resolve(__dirname, 'apps/**/*.test.ts'),
    ],
  },
  resolve: {
    alias: {
      '@horse-timer/types': path.resolve(__dirname, 'packages/types/src/index.ts'),
      '@horse-timer/timer-engine': path.resolve(__dirname, 'packages/timer-engine/src/index.ts'),
      '@horse-timer/hardware-adapters': path.resolve(__dirname, 'packages/hardware-adapters/src/index.ts'),
      '@horse-timer/ui': path.resolve(__dirname, 'packages/ui/src/index.ts'),
    },
  },
});
