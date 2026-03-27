import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { QueueService } from './queue.service';

@Controller('classes/:classId/queue')
export class QueueController {
  constructor(@Inject(QueueService) private readonly queueService: QueueService) {}

  @Get()
  list(@Param('classId') classId: string) {
    return this.queueService.list(classId);
  }

  @Post('advance')
  advance() {
    return this.queueService.advance();
  }

  @Post('reorder')
  reorder(@Param('classId') classId: string, @Body('competitorIds') competitorIds: string[]) {
    return this.queueService.reorder(classId, competitorIds ?? []);
  }
}
