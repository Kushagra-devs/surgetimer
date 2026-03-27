import { Injectable } from '@nestjs/common';
import { addAudit, demoStore } from '../common/demo-store';

@Injectable()
export class EventsService {
  list() {
    return demoStore.events;
  }

  create(body: Record<string, string>) {
    const arenaIds = (body.arenaIds ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const item = {
      id: `event-${Date.now()}`,
      name: body.name ?? 'Untitled Event',
      venue: body.venue ?? 'Unknown Venue',
      timezone: body.timezone ?? 'UTC',
      status: body.status ?? 'DRAFT',
      arenaIds,
      eventCode: body.eventCode ?? `EVT-${Date.now().toString().slice(-6)}`,
    };
    demoStore.events.push(item);
    addAudit('EVENT_CREATED', 'EVENT', item.id);
    return item;
  }
}
