import { Controller, Get, Inject } from '@nestjs/common';
import { LogsService } from './logs.service';

@Controller('logs')
export class LogsController {
  constructor(@Inject(LogsService) private readonly logsService: LogsService) {}

  @Get('audit')
  audit() {
    return this.logsService.listAudit();
  }

  @Get('system')
  system() {
    return this.logsService.systemFeed();
  }
}
