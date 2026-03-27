import { Inject, Injectable } from '@nestjs/common';
import type {
  AppSettings,
  IntegrationSettings,
  OverlayCustomization,
  WidgetDefinition,
} from '@horse-timer/types';
import { demoStore } from '../common/demo-store';
import { PrismaService } from '../persistence/prisma.service';
import { RedisCacheService } from '../persistence/redis-cache.service';

const SETTINGS_CACHE_KEY = 'surgetimer:settings:bundle';
const WIDGETS_CACHE_KEY = 'surgetimer:settings:widgets';
const DEFAULT_CONFIG_ID = 'default';

type PersistedSettingsBundle = {
  app: AppSettings;
  overlay: OverlayCustomization;
  integrations: IntegrationSettings;
};

@Injectable()
export class SettingsPersistenceService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisCacheService) private readonly redis: RedisCacheService,
  ) {}

  async loadBundle(): Promise<PersistedSettingsBundle> {
    const prisma = this.prisma as unknown as {
      integrationConfig: {
        findUnique(args: unknown): Promise<{
          appSettingsJson: unknown;
          overlaySettingsJson: unknown;
          integrationJson: unknown;
        } | null>;
      };
    };
    const cached = await this.redis.getJson<PersistedSettingsBundle>(SETTINGS_CACHE_KEY);
    if (cached) {
      return cached;
    }

    if (!this.prisma.isAvailable()) {
      return {
        app: demoStore.settings,
        overlay: demoStore.overlayCustomization,
        integrations: demoStore.integrations,
      };
    }

    const record = await prisma.integrationConfig.findUnique({
      where: { id: DEFAULT_CONFIG_ID },
    });

    const bundle: PersistedSettingsBundle = record
      ? {
          app: record.appSettingsJson as AppSettings,
          overlay: record.overlaySettingsJson as OverlayCustomization,
          integrations: record.integrationJson as IntegrationSettings,
        }
      : {
          app: demoStore.settings,
          overlay: demoStore.overlayCustomization,
          integrations: demoStore.integrations,
        };

    await this.redis.setJson(SETTINGS_CACHE_KEY, bundle);
    return bundle;
  }

  async saveBundle(bundle: PersistedSettingsBundle): Promise<PersistedSettingsBundle> {
    const prisma = this.prisma as unknown as {
      integrationConfig: {
        upsert(args: unknown): Promise<unknown>;
      };
    };
    if (this.prisma.isAvailable()) {
      await prisma.integrationConfig.upsert({
        where: { id: DEFAULT_CONFIG_ID },
        update: {
          appSettingsJson: bundle.app,
          overlaySettingsJson: bundle.overlay,
          integrationJson: bundle.integrations,
        },
        create: {
          id: DEFAULT_CONFIG_ID,
          appSettingsJson: bundle.app,
          overlaySettingsJson: bundle.overlay,
          integrationJson: bundle.integrations,
        },
      });
    }

    await this.redis.setJson(SETTINGS_CACHE_KEY, bundle);
    return bundle;
  }

  async loadWidgets(): Promise<WidgetDefinition[]> {
    const prisma = this.prisma as unknown as {
      widgetConfig: {
        findMany(args: unknown): Promise<Array<{
          id: string;
          name: string;
          kind: string;
          status: string;
          route: string;
          width: number;
          height: number;
          configJson: unknown;
        }>>;
      };
    };
    const cached = await this.redis.getJson<WidgetDefinition[]>(WIDGETS_CACHE_KEY);
    if (cached) {
      return cached;
    }

    if (!this.prisma.isAvailable()) {
      return demoStore.widgets;
    }

    const records = await prisma.widgetConfig.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const widgets = records.length
      ? records.map((record) => ({
          id: record.id,
          name: record.name,
          kind: record.kind as WidgetDefinition['kind'],
          status: record.status as WidgetDefinition['status'],
          route: record.route,
          width: record.width,
          height: record.height,
          ...(record.configJson as Omit<WidgetDefinition, 'id' | 'name' | 'kind' | 'status' | 'route' | 'width' | 'height'>),
        }))
      : demoStore.widgets;

    await this.redis.setJson(WIDGETS_CACHE_KEY, widgets);
    return widgets;
  }

  async saveWidgets(widgets: WidgetDefinition[]): Promise<void> {
    const prisma = this.prisma as unknown as {
      widgetConfig: {
        deleteMany(): unknown;
        create(args: unknown): unknown;
      };
      $transaction(args: unknown[]): Promise<unknown>;
    };
    if (this.prisma.isAvailable()) {
      await prisma.$transaction([
        prisma.widgetConfig.deleteMany(),
        ...widgets.map((widget) =>
          prisma.widgetConfig.create({
            data: {
              id: widget.id,
              name: widget.name,
              kind: widget.kind,
              status: widget.status,
              route: widget.route,
              width: widget.width,
              height: widget.height,
              configJson: {
                title: widget.title,
                subtitle: widget.subtitle,
                body: widget.body,
                accentColor: widget.accentColor,
                backgroundColor: widget.backgroundColor,
                textColor: widget.textColor,
                sponsorName: widget.sponsorName,
                mediaLabel: widget.mediaLabel,
                ctaLabel: widget.ctaLabel,
                removable: widget.removable,
                transparentBackground: widget.transparentBackground,
              },
            },
          }),
        ),
      ]);
    }

    await this.redis.setJson(WIDGETS_CACHE_KEY, widgets);
  }

  async clearCaches() {
    await this.redis.deleteMany([SETTINGS_CACHE_KEY, WIDGETS_CACHE_KEY]);
  }
}
