import { Inject, Injectable } from '@nestjs/common';
import type { HardwareDiagnosticEntry, TimerSnapshot, VmixCommandResult } from '@horse-timer/types';
import { PrismaService } from './prisma.service';
import { RedisCacheService } from './redis-cache.service';

const RUNTIME_CACHE_KEY = 'surgetimer:runtime:state';
const DIAGNOSTICS_CACHE_KEY = 'surgetimer:runtime:diagnostics';
const VMIX_CACHE_KEY = 'surgetimer:runtime:vmix';
const DEFAULT_RUNTIME_ID = 'active';

type RuntimeStatePayload = {
  activeClassId: string;
  currentIndex: number;
  snapshot: TimerSnapshot;
  runHistory: Array<Record<string, unknown>>;
  currentRunEvents?: Array<Record<string, unknown>>;
};

@Injectable()
export class RuntimeStateService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisCacheService) private readonly redis: RedisCacheService,
  ) {}

  async loadRuntimeState(): Promise<RuntimeStatePayload | null> {
    const cached = await this.redis.getJson<RuntimeStatePayload>(RUNTIME_CACHE_KEY);
    if (cached) {
      return cached;
    }

    if (!this.prisma.isAvailable()) {
      return null;
    }

    const prisma = this.prisma as unknown as {
      runtimeState: {
        findUnique(args: unknown): Promise<{
          activeClassId: string;
          currentIndex: number;
          snapshotJson: unknown;
          runHistoryJson: unknown;
          currentRunEventsJson: unknown;
        } | null>;
      };
    };

    const record = await prisma.runtimeState.findUnique({
      where: { id: DEFAULT_RUNTIME_ID },
    });

    if (!record) {
      return null;
    }

    const payload = {
      activeClassId: record.activeClassId,
      currentIndex: record.currentIndex,
      snapshot: record.snapshotJson as TimerSnapshot,
      runHistory: record.runHistoryJson as Array<Record<string, unknown>>,
      currentRunEvents: (record.currentRunEventsJson as Array<Record<string, unknown>> | undefined) ?? [],
    };

    await this.redis.setJson(RUNTIME_CACHE_KEY, payload);
    return payload;
  }

  async saveRuntimeState(payload: RuntimeStatePayload) {
    if (this.prisma.isAvailable()) {
      const prisma = this.prisma as unknown as {
        runtimeState: {
          upsert(args: unknown): Promise<unknown>;
        };
      };

      await prisma.runtimeState.upsert({
        where: { id: DEFAULT_RUNTIME_ID },
        update: {
          activeClassId: payload.activeClassId,
          currentIndex: payload.currentIndex,
          snapshotJson: payload.snapshot,
          runHistoryJson: payload.runHistory,
          currentRunEventsJson: payload.currentRunEvents ?? [],
        },
        create: {
          id: DEFAULT_RUNTIME_ID,
          activeClassId: payload.activeClassId,
          currentIndex: payload.currentIndex,
          snapshotJson: payload.snapshot,
          runHistoryJson: payload.runHistory,
          currentRunEventsJson: payload.currentRunEvents ?? [],
        },
      });
    }

    await this.redis.setJson(RUNTIME_CACHE_KEY, payload);
  }

  async loadDiagnostics(): Promise<HardwareDiagnosticEntry[]> {
    const cached = await this.redis.getJson<HardwareDiagnosticEntry[]>(DIAGNOSTICS_CACHE_KEY);
    if (cached) {
      return cached;
    }
    if (!this.prisma.isAvailable()) {
      return [];
    }
    const prisma = this.prisma as unknown as {
      hardwareDiagnosticLog: {
        findMany(args: unknown): Promise<Array<{ id: string; level: string; message: string; createdAt: Date }>>;
      };
    };
    const records = await prisma.hardwareDiagnosticLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const entries = records.map((record) => ({
      id: record.id,
      level: record.level as HardwareDiagnosticEntry['level'],
      message: record.message,
      createdAt: record.createdAt.toISOString(),
    }));
    await this.redis.setJson(DIAGNOSTICS_CACHE_KEY, entries);
    return entries;
  }

  async saveDiagnostic(entry: HardwareDiagnosticEntry) {
    if (this.prisma.isAvailable()) {
      const prisma = this.prisma as unknown as {
        hardwareDiagnosticLog: {
          create(args: unknown): Promise<unknown>;
        };
      };
      await prisma.hardwareDiagnosticLog.create({
        data: {
          id: entry.id,
          level: entry.level,
          message: entry.message,
          createdAt: new Date(entry.createdAt),
        },
      });
    }
    const existing = (await this.redis.getJson<HardwareDiagnosticEntry[]>(DIAGNOSTICS_CACHE_KEY)) ?? [];
    await this.redis.setJson(DIAGNOSTICS_CACHE_KEY, [entry, ...existing].slice(0, 50));
  }

  async loadVmixTelemetry(): Promise<VmixCommandResult[]> {
    const cached = await this.redis.getJson<VmixCommandResult[]>(VMIX_CACHE_KEY);
    if (cached) {
      return cached;
    }
    if (!this.prisma.isAvailable()) {
      return [];
    }
    const prisma = this.prisma as unknown as {
      vmixTelemetryLog: {
        findMany(args: unknown): Promise<Array<{
          id: string;
          ok: boolean;
          url: string;
          reason: string | null;
          simulated: boolean | null;
          attempts: number | null;
          statusCode: number | null;
          createdAt: Date;
        }>>;
      };
    };
    const records = await prisma.vmixTelemetryLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    const entries = records.map((record) => ({
      ok: record.ok,
      url: record.url,
      reason: record.reason ?? undefined,
      simulated: record.simulated ?? undefined,
      attempts: record.attempts ?? undefined,
      statusCode: record.statusCode ?? undefined,
      at: record.createdAt.toISOString(),
    }));
    await this.redis.setJson(VMIX_CACHE_KEY, entries);
    return entries;
  }

  async saveVmixTelemetry(entry: VmixCommandResult) {
    if (this.prisma.isAvailable()) {
      const prisma = this.prisma as unknown as {
        vmixTelemetryLog: {
          create(args: unknown): Promise<unknown>;
        };
      };
      await prisma.vmixTelemetryLog.create({
        data: {
          ok: entry.ok,
          url: entry.url,
          reason: entry.reason,
          simulated: entry.simulated,
          attempts: entry.attempts,
          statusCode: entry.statusCode,
          createdAt: new Date(entry.at),
        },
      });
    }
    const existing = (await this.redis.getJson<VmixCommandResult[]>(VMIX_CACHE_KEY)) ?? [];
    await this.redis.setJson(VMIX_CACHE_KEY, [entry, ...existing].slice(0, 50));
  }

  async clearRuntimeCaches() {
    await this.redis.deleteMany([RUNTIME_CACHE_KEY, DIAGNOSTICS_CACHE_KEY, VMIX_CACHE_KEY]);
  }
}
