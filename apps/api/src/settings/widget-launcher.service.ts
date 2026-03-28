import { Injectable } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

@Injectable()
export class WidgetLauncherService {
  private readonly childPids = new Set<number>();

  async launch(options: {
    widgetId?: string;
    width?: number;
    height?: number;
    publicBaseUrl?: string;
  }) {
    const rootDir = this.resolveRepoRoot();

    if (!rootDir) {
      return {
        launched: false,
        reason: 'Workspace root or widget app path could not be resolved.',
      };
    }

    const electronBinary = this.resolveElectronBinary(rootDir);
    const widgetAppPath = path.resolve(rootDir, 'apps', 'widget');

    if (!existsSync(widgetAppPath)) {
      return {
        launched: false,
        reason: 'Workspace root or widget app path could not be resolved.',
      };
    }

    if (!electronBinary || !existsSync(electronBinary)) {
      return {
        launched: false,
        reason: 'Electron binary not found. Run npm install first.',
      };
    }

    const publicBaseUrl = this.resolvePublicBaseUrl(options.publicBaseUrl);
    const url = new URL(`${publicBaseUrl.replace(/\/$/, '')}/overlay/widget`);
    url.searchParams.set('desktop', '1');
    if (options.widgetId) {
      url.searchParams.set('widget', options.widgetId);
    }

    return await new Promise<{ launched: boolean; pid?: number | null; url?: string; reason?: string }>((resolve) => {
      let settled = false;
      const child = spawn(electronBinary, [widgetAppPath], {
        cwd: rootDir,
        detached: true,
        stdio: 'ignore',
        env: {
          ...process.env,
          WIDGET_URL: url.toString(),
          WIDGET_WIDTH: String(options.width ?? 760),
          WIDGET_HEIGHT: String(options.height ?? 280),
        },
      });

      child.once('spawn', () => {
        if (child.pid) {
          this.childPids.add(child.pid);
          child.unref();
        }
        settled = true;
        resolve({
          launched: true,
          pid: child.pid ?? null,
          url: url.toString(),
        });
      });

      child.once('error', (error) => {
        if (settled) {
          return;
        }
        settled = true;
        resolve({
          launched: false,
          reason: error.message,
        });
      });

      setTimeout(() => {
        if (settled) {
          return;
        }
        settled = true;
        resolve({
          launched: false,
          reason: 'Widget process did not confirm launch in time.',
        });
      }, 1500);
    });
  }

  private resolvePublicBaseUrl(preferred?: string) {
    if (preferred) {
      return preferred.replace(/\/$/, '');
    }

    if (process.env.PUBLIC_WEB_BASE_URL) {
      return process.env.PUBLIC_WEB_BASE_URL.replace(/\/$/, '');
    }

    if (process.env.NODE_ENV !== 'production') {
      return 'http://localhost:3001';
    }

    return 'https://surgetimer.vercel.app';
  }

  closeAll() {
    const closed: number[] = [];

    for (const pid of this.childPids) {
      try {
        process.kill(pid);
        closed.push(pid);
      } catch {
        // Ignore stale pids; the app window may already be closed.
      }
    }

    this.childPids.clear();

    return {
      closed: true,
      closedPids: closed,
    };
  }

  private resolveRepoRoot() {
    const candidates = [
      process.cwd(),
      path.resolve(process.cwd(), '..'),
      path.resolve(process.cwd(), '../..'),
      path.resolve(__dirname, '../../..'),
      path.resolve(__dirname, '../../../..'),
    ];

    return candidates.find((candidate) => existsSync(path.resolve(candidate, 'apps', 'widget', 'main.cjs'))) ?? null;
  }

  private resolveElectronBinary(rootDir: string) {
    const candidates = [
      path.resolve(rootDir, 'node_modules', 'electron', 'dist', 'Electron.app', 'Contents', 'MacOS', 'Electron'),
      path.resolve(rootDir, 'node_modules', '.bin', 'electron'),
      path.resolve(process.cwd(), 'node_modules', 'electron', 'dist', 'Electron.app', 'Contents', 'MacOS', 'Electron'),
      path.resolve(process.cwd(), 'node_modules', '.bin', 'electron'),
    ];

    return candidates.find((candidate) => existsSync(candidate)) ?? null;
  }
}
