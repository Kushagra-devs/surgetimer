'use client';

import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import type { PublicLiveFeed, RunEventTrailEntry } from '@horse-timer/types';
import { apiGet } from '../lib/api';
import { DEFAULT_PUBLIC_API_BASE_URL } from '../lib/runtime-config';
import { formatDisplayTimer, getTimerLabel } from '../lib/timer-state';

const API_BASE = DEFAULT_PUBLIC_API_BASE_URL;

export function SpectatorLiveView({
  eventId,
  classId,
  token,
}: {
  eventId?: string;
  classId?: string;
  token?: string;
}) {
  const [feed, setFeed] = useState<PublicLiveFeed | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let mounted = true;

    const params = new URLSearchParams();
    if (eventId) {
      params.set('eventId', eventId);
    }
    if (classId) {
      params.set('classId', classId);
    }
    if (token) {
      params.set('token', token);
    }
    const feedPath = `/overlay/public-feed${params.toString() ? `?${params.toString()}` : ''}`;

    async function load() {
      const response = await apiGet<PublicLiveFeed>(feedPath);
      if (mounted) {
        setFeed(response);
      }
    }

    void load();
    const socket = io(API_BASE);
    socket.on('overlay.updated', () => void load());
    socket.on('run.completed', () => void load());
    socket.on('timing.state.updated', () => void load());
    const interval = window.setInterval(() => {
      void load();
    }, feed?.spectator.autoRefreshMs ?? 900);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      socket.close();
    };
  }, [classId, eventId, feed?.spectator.autoRefreshMs, token]);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      setNow(Date.now());
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const overlay = feed?.overlay;
  const spectator = feed?.spectator;
  const activeRun = feed?.activeRun;
  const timerValue = formatDisplayTimer(activeRun?.snapshot ?? null, activeRun?.elapsedMs ?? 0, now);
  const activeTimeline = useMemo(() => (activeRun?.eventTrail ?? []).slice().reverse(), [activeRun?.eventTrail]);
  const historyItems = useMemo(() => (feed?.completedRuns ?? []).slice(0, spectator?.historyLimit ?? 24), [feed?.completedRuns, spectator?.historyLimit]);

  if (feed?.accessDenied) {
    return (
      <main className="spectator-shell spectator-locked">
        <section className="spectator-card" style={{ maxWidth: 720, margin: '10vh auto 0' }}>
          <p className="spectator-kicker">Protected Spectator Feed</p>
          <h1 className="spectator-title" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>Access Required</h1>
          <p className="spectator-copy">{feed.denialReason}</p>
        </section>
      </main>
    );
  }

  return (
    <main
      className="spectator-shell"
      style={{
        background:
          `radial-gradient(circle at top left, ${withAlpha(spectator?.accentColor ?? '#6bc6ff', 0.22)}, transparent 28%), radial-gradient(circle at 90% 10%, rgba(5, 150, 105, 0.1), transparent 18%), linear-gradient(180deg, ${spectator?.backgroundColor ?? '#08111b'} 0%, #0d1726 100%)`,
        color: spectator?.textColor ?? '#f8fafc',
      }}
    >
      <section className="spectator-hero">
        <div>
          <p className="spectator-kicker">{spectator?.title ?? 'Live Arena Scorecard'}</p>
          <h1 className="spectator-title">
            {spectator?.showEventName !== false ? (feed?.eventName ?? 'Awaiting Event') : overlay?.className ?? 'Awaiting Class'}
          </h1>
          <p className="spectator-copy">{spectator?.subtitle}</p>
          <div className="spectator-ribbon">
            {spectator?.showClassName !== false ? <span>{feed?.className ?? overlay?.className ?? 'Awaiting class'}</span> : null}
            <span>{overlay?.stateLabel ?? 'IDLE'}</span>
            {spectator?.showUpdatedAt !== false ? <span>Updated {feed ? new Date(feed.updatedAt).toLocaleTimeString() : '--'}</span> : null}
          </div>
        </div>
        <div className="spectator-status">
          <span className="status-pill" style={{ background: withAlpha(spectator?.accentColor ?? '#6bc6ff', 0.18), color: spectator?.textColor ?? '#f8fafc' }}>
            {overlay?.stateLabel ?? 'IDLE'}
          </span>
          {spectator?.showScanHelp ? <span className="spectator-updated">Mobile-ready spectator feed</span> : null}
        </div>
      </section>

      <section className="spectator-grid">
        <div className="spectator-card primary" style={{ background: withAlpha(spectator?.backgroundColor ?? '#08111b', spectator?.cardOpacity ?? 0.78) }}>
          <p className="spectator-section-label">{getTimerLabel(activeRun?.snapshot?.state)}</p>
          <div className="spectator-timer">{timerValue}</div>
          <div className="spectator-identity">
            <div>
              <p className="spectator-person">{overlay?.riderName ?? 'Awaiting rider'}</p>
              {spectator?.showHorseName !== false ? <p className="spectator-subperson">{overlay?.horseName ?? 'Awaiting horse'}</p> : null}
            </div>
            <div className="spectator-bib">#{overlay?.competitorNumber ?? '--'}</div>
          </div>
        </div>

        <div className="spectator-card" style={{ background: withAlpha(spectator?.backgroundColor ?? '#08111b', spectator?.cardOpacity ?? 0.72) }}>
          <p className="spectator-section-label">Live Scorecard</p>
          <div className="spectator-stats">
            <div className="spectator-stat">
              <span>State</span>
              <strong>{overlay?.stateLabel ?? 'IDLE'}</strong>
            </div>
            {spectator?.showPenalties !== false ? (
              <div className="spectator-stat">
                <span>Penalties</span>
                <strong>{overlay?.penalties ?? '0'}</strong>
              </div>
            ) : null}
            {spectator?.showSponsor !== false ? (
              <div className="spectator-stat">
                <span>Sponsor</span>
                <strong>{overlay?.sponsorName ?? 'Official Partner'}</strong>
              </div>
            ) : null}
            <div className="spectator-stat">
              <span>Brand</span>
              <strong>{overlay?.logoUrl ?? 'SURGE'}</strong>
            </div>
            {spectator?.showQueuePreview ? (
              <div className="spectator-stat span-2">
                <span>On Deck</span>
                <strong style={{ display: 'grid', gap: 8 }}>
                  {(feed?.queuePreview ?? []).map((item) => (
                    <span key={item.competitorId} className="spectator-queue-item">
                      #{item.bibNumber} {item.riderName} / {item.horseName}
                    </span>
                  ))}
                </strong>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="spectator-grid secondary">
        {spectator?.showActiveTimeline !== false ? (
        <div className="spectator-card" style={{ background: withAlpha(spectator?.backgroundColor ?? '#08111b', spectator?.cardOpacity ?? 0.72) }}>
          <div className="split-row" style={{ alignItems: 'baseline', marginBottom: 14 }}>
            <p className="spectator-section-label" style={{ marginBottom: 0 }}>Active Run Timeline</p>
            <span className="spectator-inline-note">{activeTimeline.length} events</span>
          </div>
          <div className="spectator-table-shell">
            <table className="spectator-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Event</th>
                  <th>Transition</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {activeTimeline.length ? activeTimeline.map((event) => (
                  <TimelineRow key={event.id} event={event} />
                )) : (
                  <tr>
                    <td colSpan={4}>No active timing events yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        ) : null}

        {spectator?.showRunHistory !== false ? (
        <div className="spectator-card" style={{ background: withAlpha(spectator?.backgroundColor ?? '#08111b', spectator?.cardOpacity ?? 0.72) }}>
          <div className="split-row" style={{ alignItems: 'baseline', marginBottom: 14 }}>
            <p className="spectator-section-label" style={{ marginBottom: 0 }}>Completed Runs</p>
            <span className="spectator-inline-note">{historyItems.length} results</span>
          </div>
          <div className="spectator-history-list">
            {historyItems.map((run) => (
              <article key={run.id} className="spectator-history-item">
                <div className="split-row" style={{ alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <p className="spectator-history-name">{run.competitor?.riderName ?? 'Unknown rider'}</p>
                    {spectator?.showHorseName !== false ? <p className="spectator-history-horse">{run.competitor?.horseName ?? 'Unknown horse'} · #{run.competitor?.bibNumber ?? '--'}</p> : null}
                  </div>
                  <span className="status-pill">{(run.elapsedMs / 1000).toFixed(2)}s</span>
                </div>
                <div className="spectator-history-meta">
                  <span>{run.state}</span>
                  <span>{run.finishReason ?? 'Completed'}</span>
                  <span>{run.mainEndedAt ? new Date(run.mainEndedAt).toLocaleTimeString() : '--'}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
        ) : null}
      </section>
    </main>
  );
}

function TimelineRow({ event }: { event: RunEventTrailEntry }) {
  return (
    <tr>
      <td>{new Date(event.at).toLocaleTimeString()}</td>
      <td>{event.eventType}</td>
      <td>{`${event.previousState} -> ${event.nextState}`}</td>
      <td>{event.accepted ? 'Accepted' : event.reason ?? 'Ignored'}</td>
    </tr>
  );
}

function withAlpha(color: string, alpha: number) {
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const normalized = hex.length === 3 ? hex.split('').map((char) => char + char).join('') : hex;
    const value = parseInt(normalized, 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  }

  return color;
}
