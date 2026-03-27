import { Inject, Injectable } from '@nestjs/common';
import { addAudit, demoStore } from '../common/demo-store';
import { TimingService } from '../timing/timing.service';

@Injectable()
export class QueueService {
  constructor(@Inject(TimingService) private readonly timingService: TimingService) {}

  list(classId: string) {
    return demoStore.competitors
      .filter((competitor) => competitor.classId === classId)
      .sort((left, right) => left.startOrder - right.startOrder);
  }

  advance() {
    addAudit('QUEUE_ADVANCED', 'QUEUE', 'class-demo');
    return this.timingService.advanceQueue();
  }

  reorder(classId: string, competitorIds: string[]) {
    const classCompetitors = this.list(classId);
    competitorIds.forEach((competitorId, index) => {
      const competitor = classCompetitors.find((item) => item.id === competitorId);
      if (competitor) {
        competitor.startOrder = index + 1;
      }
    });
    addAudit('QUEUE_REORDERED', 'QUEUE', classId);
    return this.list(classId);
  }
}
