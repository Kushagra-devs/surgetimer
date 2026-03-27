import { Inject, Injectable } from '@nestjs/common';
import { TimerState, type OverlayView, type PublicLiveFeed } from '@horse-timer/types';
import { demoStore } from '../common/demo-store';
import { TimingService } from '../timing/timing.service';

@Injectable()
export class OverlayService {
  constructor(@Inject(TimingService) private readonly timingService: TimingService) {}

  getLiveState(): OverlayView {
    const active = this.timingService.getState();
    const competitor = active.competitor;
    return {
      timerState: active.snapshot.state,
      stateLabel: this.toLabel(active.snapshot.state),
      riderName: competitor?.riderName ?? 'Awaiting rider',
      horseName: competitor?.horseName ?? 'Awaiting horse',
      className: '1.40m Grand Prix',
      competitorNumber: competitor?.bibNumber ?? '--',
      elapsedMs: active.elapsedMs,
      penalties: '0',
      sponsorName: demoStore.overlayCustomization.sponsorText,
      logoUrl: demoStore.overlayCustomization.logoText,
      snapshot: active.snapshot,
    };
  }

  getCustomization() {
    return demoStore.overlayCustomization;
  }

  getVmixDataSourceRecord() {
    const overlay = this.getLiveState();
    const live = this.timingService.getLiveHistory();

    return {
      UpdatedAt: new Date().toISOString(),
      TimerState: overlay.timerState,
      StateLabel: overlay.stateLabel,
      TimerText: (overlay.elapsedMs / 1000).toFixed(2),
      RiderName: overlay.riderName,
      HorseName: overlay.horseName,
      ClassName: overlay.className,
      CompetitorNumber: overlay.competitorNumber,
      Penalties: overlay.penalties,
      SponsorName: overlay.sponsorName,
      LogoLabel: overlay.logoUrl,
      FinishWarnings: live.snapshot.context.warnings.join(' | '),
    };
  }

  getVmixDataSourceCsv() {
    const record = this.getVmixDataSourceRecord();
    const headers = Object.keys(record);
    const values = headers.map((key) => {
      const value = String(record[key as keyof typeof record] ?? '');
      return `"${value.replaceAll('"', '""')}"`;
    });
    return `${headers.join(',')}\n${values.join(',')}\n`;
  }

  getPublicFeed(options?: { eventId?: string; classId?: string; token?: string }): PublicLiveFeed {
    const spectator = demoStore.settings.spectator;
    const active = this.timingService.getState();
    const activeCompetitor = active.competitor;
    const resolvedClassId = options?.classId ?? activeCompetitor?.classId ?? demoStore.classes[0]?.id;
    const resolvedClass = demoStore.classes.find((item) => item.id === resolvedClassId) ?? demoStore.classes[0];
    const resolvedEventId = options?.eventId ?? resolvedClass?.eventId ?? demoStore.events[0]?.id;
    const resolvedEvent = demoStore.events.find((item) => item.id === resolvedEventId) ?? demoStore.events[0];
    const query = spectator.requireToken ? `?token=${encodeURIComponent(spectator.shareToken)}` : '';
    const shareBase = spectator.publicBaseUrl || process.env.PUBLIC_WEB_BASE_URL || 'https://surgetimer.vercel.app';
    const shareUrl = `${shareBase}/live/${resolvedEventId}/${resolvedClassId}${query}`;

    if (spectator.requireToken && options?.token !== spectator.shareToken) {
      return {
        accessDenied: true,
        denialReason: 'A valid spectator access token is required for this live page.',
        shareUrl,
        updatedAt: new Date().toISOString(),
        eventId: resolvedEventId,
        eventName: resolvedEvent?.name,
        classId: resolvedClassId,
        className: resolvedClass?.name,
        queuePreview: [],
        spectator,
        overlay: this.getLiveState(),
        activeRun: this.timingService.getLiveHistory(),
        completedRuns: [],
      };
    }

    const filteredRuns = this.timingService
      .getRunHistory()
      .filter((run) => (!resolvedEventId || run.eventId === resolvedEventId) && (!resolvedClassId || run.classId === resolvedClassId))
      .slice(0, spectator.historyLimit);
    const queuePreview = demoStore.competitors
      .filter((item) => item.classId === resolvedClassId)
      .sort((a, b) => a.startOrder - b.startOrder)
      .slice(0, spectator.queuePreviewSize)
      .map((item) => ({
        competitorId: item.id,
        riderName: item.riderName,
        horseName: item.horseName,
        bibNumber: item.bibNumber,
      }));

    return {
      shareUrl,
      updatedAt: new Date().toISOString(),
      eventId: resolvedEventId,
      eventName: resolvedEvent?.name,
      classId: resolvedClassId,
      className: resolvedClass?.name,
      queuePreview,
      spectator,
      overlay: this.getLiveState(),
      activeRun: this.timingService.getLiveHistory(),
      completedRuns: filteredRuns as PublicLiveFeed['completedRuns'],
    };
  }

  private toLabel(state: TimerState): OverlayView['stateLabel'] {
    switch (state) {
      case TimerState.WARMUP_RUNNING:
      case TimerState.WARMUP_PAUSED:
        return 'WARMUP';
      case TimerState.ROUND_RUNNING:
      case TimerState.ROUND_PAUSED:
        return 'LIVE';
      case TimerState.HOLD:
        return 'HOLD';
      case TimerState.COMPLETED:
        return 'FINISHED';
      case TimerState.READY:
        return 'READY';
      default:
        return 'IDLE';
    }
  }
}
