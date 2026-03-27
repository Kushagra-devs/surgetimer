'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { AppSettings } from '@horse-timer/types';
import { apiGet } from '../lib/api';

const navSections = [
  {
    title: 'Live Operations',
    links: [
      ['Event Day', '/event-day', 'Focus'],
      ['Dashboard', '/dashboard', 'Live'],
      ['Status', '/status', 'Health'],
      ['Judge', '/judge', 'Control'],
      ['Mobile Control', '/mobile-control', 'Phone'],
      ['Queue', '/queue', 'Run'],
      ['Reports', '/reports', 'Ops'],
      ['Run Logs', '/run-logs', 'Audit'],
    ],
  },
  {
    title: 'Hardware & Broadcast',
    links: [
      ['Hardware', '/hardware-console', 'ALGE'],
      ['Overlay', '/overlay-preview', 'vMix'],
      ['Spectator Live', '/live', 'Share'],
      ['Simulator', '/simulator', 'Mock'],
    ],
  },
  {
    title: 'Competition Data',
    links: [
      ['Events', '/events', 'Setup'],
      ['Classes', '/classes', 'Setup'],
      ['Riders', '/riders', 'Data'],
      ['Horses', '/horses', 'Data'],
      ['Competitors', '/competitors', 'Data'],
    ],
  },
  {
    title: 'Administration',
    links: [
      ['Settings', '/settings', 'Config'],
      ['Super Admin', '/super-admin', 'Admin'],
      ['Documentation', '/documentation', 'Help'],
    ],
  },
] as const;

export function Nav() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    void apiGet<AppSettings>('/settings/app').then(setSettings).catch(() => undefined);
  }, []);

  const brandName = settings?.branding.shortLabel || 'SurgeTimer';
  const brandSubtitle = settings?.branding.productLabel || 'Live timing, broadcast, and venue control';
  const brandIconText = settings?.branding.logoText || 'ST';
  const primaryColor = settings?.branding.primaryColor || '#0f7cff';
  const eventDayMode = pathname === '/event-day';
  const activeSections = eventDayMode
    ? [
        {
          title: 'Event-Day Essentials',
          links: [
            ['Event Day', '/event-day', 'Focus'],
            ['Status', '/status', 'Health'],
            ['Judge', '/judge', 'Control'],
            ['Mobile Control', '/mobile-control', 'Phone'],
            ['Queue', '/queue', 'Run'],
            ['Hardware', '/hardware-console', 'ALGE'],
            ['Reports', '/reports', 'Ops'],
            ['Run Logs', '/run-logs', 'Audit'],
          ],
        },
      ]
    : navSections;

  return (
    <nav className="sidebar">
      <p className="brand-kicker">{settings?.branding.organizationName || 'SurgeTimer Platform'}</p>
      <div className="brand-mark">
        <div className="brand-icon" style={{ color: primaryColor, borderColor: `${primaryColor}22` }}>
          {brandIconText}
        </div>
        <div>
          <h2 className="brand-title">{brandName}</h2>
          <p className="brand-subtitle">{brandSubtitle}</p>
        </div>
      </div>

      <div className="nav-sections">
        {activeSections.map((section) => (
          <section key={section.title} className="nav-section">
            <p className="nav-section-title">{section.title}</p>
            <div className="nav-grid">
              {section.links.map(([label, href, tag]) => (
                <a className={`nav-link${pathname === href ? ' active' : ''}`} key={href} href={href}>
                  <span className="nav-label">{label}</span>
                  <span className="nav-tag">{tag}</span>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </nav>
  );
}
