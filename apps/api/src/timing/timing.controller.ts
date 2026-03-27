import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { TimingService } from './timing.service';

@Controller('timing')
export class TimingController {
  constructor(@Inject(TimingService) private readonly timingService: TimingService) {}

  @Post('arm/:competitorEntryId')
  arm(@Param('competitorEntryId') competitorEntryId: string) {
    return this.timingService.armCompetitor(competitorEntryId);
  }

  @Post('manual/warmup-start')
  manualWarmupStart() {
    return this.timingService.manualWarmupStart();
  }

  @Post('manual/main-start')
  manualMainStart() {
    return this.timingService.manualMainStart();
  }

  @Post('manual/stop')
  manualStop() {
    return this.timingService.manualStop();
  }

  @Post('pause')
  pause() {
    return this.timingService.pause();
  }

  @Post('resume')
  resume() {
    return this.timingService.resume();
  }

  @Post('reset')
  reset() {
    return this.timingService.reset();
  }

  @Post('abort')
  abort(@Body('reason') reason?: string) {
    return this.timingService.abort('judge-demo', reason);
  }

  @Get('state')
  state() {
    return this.timingService.getState();
  }

  @Get('active-run')
  activeRun() {
    return this.timingService.getActiveRun();
  }

  @Get('history')
  history() {
    return this.timingService.getRunHistory();
  }

  @Get('history/live')
  liveHistory() {
    return this.timingService.getLiveHistory();
  }

  @Post('history/:runId/result')
  updateRunResult(
    @Param('runId') runId: string,
    @Body('penalties') penalties?: number,
    @Body('resultCode') resultCode?: string,
    @Body('notes') notes?: string,
  ) {
    return this.timingService.updateRunResult(runId, { penalties, resultCode, notes });
  }
}
