import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { CompetitorsService } from './competitors.service';

@Controller('competitors')
export class CompetitorsController {
  constructor(@Inject(CompetitorsService) private readonly competitorsService: CompetitorsService) {}

  @Get()
  list() {
    return this.competitorsService.list();
  }

  @Post()
  create(@Body() body: Record<string, string>) {
    return this.competitorsService.create(body);
  }
}
