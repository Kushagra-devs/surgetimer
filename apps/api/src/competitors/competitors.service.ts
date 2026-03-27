import { Injectable } from '@nestjs/common';
import { addAudit, demoStore } from '../common/demo-store';

@Injectable()
export class CompetitorsService {
  list() {
    return demoStore.competitors;
  }

  create(body: Record<string, string>) {
    const competitor = {
      id: `entry-${Date.now()}`,
      classId: body.classId ?? 'class-demo',
      riderName: body.riderName ?? 'New Rider',
      horseName: body.horseName ?? 'New Horse',
      bibNumber: body.bibNumber ?? `${demoStore.competitors.length + 100}`,
      startOrder: Number(body.startOrder ?? demoStore.competitors.length + 1),
      status: 'QUEUED' as const,
    };
    demoStore.competitors.push(competitor);
    addAudit('COMPETITOR_CREATED', 'COMPETITOR', competitor.id);
    return competitor;
  }
}
