import { Injectable } from '@nestjs/common';
import { addAudit, demoStore } from '../common/demo-store';

@Injectable()
export class ClassesService {
  list(eventId: string) {
    return demoStore.classes.filter((competitionClass) => competitionClass.eventId === eventId);
  }

  create(eventId: string, body: Record<string, string>) {
    const item = {
      id: `class-${Date.now()}`,
      eventId,
      name: body.name ?? 'New Class',
      code: body.code ?? 'NEW',
    };
    demoStore.classes.push(item);
    addAudit('CLASS_CREATED', 'CLASS', item.id);
    return item;
  }
}
