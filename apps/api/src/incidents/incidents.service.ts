import { Inject, Injectable } from '@nestjs/common';
import type { IncidentEntry } from '@horse-timer/types';
import { addAudit, addIncident, demoStore } from '../common/demo-store';
import { DashboardService } from '../dashboard/dashboard.service';
import { HardwareService } from '../hardware/hardware.service';

@Injectable()
export class IncidentsService {
  constructor(
    @Inject(DashboardService) private readonly dashboardService: DashboardService,
    @Inject(HardwareService) private readonly hardwareService: HardwareService,
  ) {}

  list() {
    return demoStore.incidents;
  }

  listSuggested() {
    const dashboard = this.dashboardService.getRealtimeStatus();
    const telemetry = this.hardwareService.getTelemetry();
    const suggestions: IncidentEntry[] = [];

    for (const blocker of dashboard.goLive.blockers) {
      suggestions.push({
        id: `suggested-${suggestions.length + 1}`,
        title: 'Go-live blocker',
        detail: blocker,
        level: 'critical',
        source: 'SYSTEM',
        status: 'OPEN',
        createdAt: new Date().toISOString(),
      });
    }

    for (const item of dashboard.analysis.filter((entry) => entry.level !== 'ok')) {
      suggestions.push({
        id: `suggested-${suggestions.length + 1}`,
        title: item.title,
        detail: item.detail,
        level: item.level === 'critical' ? 'critical' : 'warn',
        source: 'SYSTEM',
        status: 'OPEN',
        createdAt: new Date().toISOString(),
      });
    }

    for (const item of telemetry.diagnostics.filter((entry) => entry.level !== 'info').slice(0, 6)) {
      suggestions.push({
        id: `suggested-${suggestions.length + 1}`,
        title: 'Hardware diagnostic',
        detail: item.message,
        level: item.level === 'error' ? 'critical' : 'warn',
        source: 'HARDWARE',
        status: 'OPEN',
        createdAt: item.createdAt,
      });
    }

    return suggestions;
  }

  create(body: Partial<IncidentEntry>) {
    const incident = addIncident({
      title: body.title ?? 'Operational incident',
      detail: body.detail ?? 'Operator-created incident entry.',
      level: body.level ?? 'warn',
      source: body.source ?? 'OPERATOR',
      notes: body.notes,
      status: body.status ?? 'OPEN',
    });
    addAudit('INCIDENT_CREATED', 'INCIDENT', incident.id);
    return incident;
  }

  acknowledge(id: string, actor = 'super-admin@surgetimer.local') {
    const incident = demoStore.incidents.find((item) => item.id === id);
    if (!incident) {
      return null;
    }
    incident.status = 'ACKNOWLEDGED';
    incident.acknowledgedAt = new Date().toISOString();
    incident.acknowledgedBy = actor;
    addAudit('INCIDENT_ACKNOWLEDGED', 'INCIDENT', id, actor);
    return incident;
  }

  resolve(id: string, actor = 'super-admin@surgetimer.local', notes?: string) {
    const incident = demoStore.incidents.find((item) => item.id === id);
    if (!incident) {
      return null;
    }
    incident.status = 'RESOLVED';
    incident.resolvedAt = new Date().toISOString();
    incident.resolvedBy = actor;
    incident.notes = notes ?? incident.notes;
    addAudit('INCIDENT_RESOLVED', 'INCIDENT', id, actor);
    return incident;
  }
}
