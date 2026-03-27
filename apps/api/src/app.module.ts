import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TimingController } from './timing/timing.controller';
import { TimingService } from './timing/timing.service';
import { HardwareController } from './hardware/hardware.controller';
import { HardwareService } from './hardware/hardware.service';
import { OverlayController } from './overlay/overlay.controller';
import { OverlayService } from './overlay/overlay.service';
import { HealthController } from './health/health.controller';
import { EventsController } from './events/events.controller';
import { EventsService } from './events/events.service';
import { ClassesController } from './classes/classes.controller';
import { ClassesService } from './classes/classes.service';
import { CompetitorsController } from './competitors/competitors.controller';
import { CompetitorsService } from './competitors/competitors.service';
import { QueueController } from './queue/queue.controller';
import { QueueService } from './queue/queue.service';
import { CsvController } from './csv/csv.controller';
import { CsvService } from './csv/csv.service';
import { RealtimeGateway } from './realtime/realtime.gateway';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { SettingsController } from './settings/settings.controller';
import { SettingsService } from './settings/settings.service';
import { LogsController } from './logs/logs.controller';
import { LogsService } from './logs/logs.service';
import { ReportsController } from './reports/reports.controller';
import { ReportsService } from './reports/reports.service';
import { VmixController } from './vmix/vmix.controller';
import { VmixService } from './vmix/vmix.service';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { IncidentsController } from './incidents/incidents.controller';
import { IncidentsService } from './incidents/incidents.service';
import { MobileAccessController } from './mobile-access/mobile-access.controller';
import { MobileAccessService } from './mobile-access/mobile-access.service';
import { PrismaService } from './persistence/prisma.service';
import { RedisCacheService } from './persistence/redis-cache.service';
import { RuntimeStateService } from './persistence/runtime-state.service';
import { SettingsPersistenceService } from './settings/settings.persistence';
import { WidgetLauncherService } from './settings/widget-launcher.service';
import { SystemController } from './system/system.controller';
import { SystemService } from './system/system.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [
    TimingController,
    HardwareController,
    OverlayController,
    HealthController,
    EventsController,
    ClassesController,
    CompetitorsController,
    QueueController,
    CsvController,
    UsersController,
    SettingsController,
    LogsController,
    ReportsController,
    VmixController,
    DashboardController,
    IncidentsController,
    MobileAccessController,
    SystemController,
  ],
  providers: [
    TimingService,
    HardwareService,
    OverlayService,
    EventsService,
    ClassesService,
    CompetitorsService,
    QueueService,
    CsvService,
    RealtimeGateway,
    UsersService,
    PrismaService,
    RedisCacheService,
    RuntimeStateService,
    SettingsPersistenceService,
    WidgetLauncherService,
    SettingsService,
    LogsService,
    ReportsService,
    VmixService,
    DashboardService,
    IncidentsService,
    MobileAccessService,
    SystemService,
  ],
})
export class AppModule {}
