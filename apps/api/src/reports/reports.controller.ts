import { Controller, Get, Inject } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(@Inject(ReportsService) private readonly reportsService: ReportsService) {}

  @Get('summary')
  summary() {
    return this.reportsService.summary();
  }

  @Get('runs.csv')
  runs() {
    return this.reportsService.runs();
  }

  @Get('diagnostics-bundle')
  diagnosticsBundle() {
    return this.reportsService.diagnosticsBundle();
  }
}
