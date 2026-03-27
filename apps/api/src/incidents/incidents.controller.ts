import { Body, Controller, Get, Inject, Param, Patch, Post } from '@nestjs/common';
import type { IncidentEntry } from '@horse-timer/types';
import { IncidentsService } from './incidents.service';

@Controller('incidents')
export class IncidentsController {
  constructor(@Inject(IncidentsService) private readonly incidentsService: IncidentsService) {}

  @Get()
  list() {
    return this.incidentsService.list();
  }

  @Get('suggested')
  suggested() {
    return this.incidentsService.listSuggested();
  }

  @Post()
  create(@Body() body: Partial<IncidentEntry>) {
    return this.incidentsService.create(body);
  }

  @Patch(':id/acknowledge')
  acknowledge(@Param('id') id: string, @Body('actor') actor?: string) {
    return this.incidentsService.acknowledge(id, actor);
  }

  @Patch(':id/resolve')
  resolve(@Param('id') id: string, @Body('actor') actor?: string, @Body('notes') notes?: string) {
    return this.incidentsService.resolve(id, actor, notes);
  }
}
