'use client';

import { useMemo, useState } from 'react';
import { IntegrationConsole } from './integration-console';
import { LiveShareConsole } from './live-share-console';
import { OverlayStudio } from './overlay-studio';
import { EventReadinessConsole } from './event-readiness-console';
import { HardwareDiscoveryConsole } from './hardware-discovery-console';
import { PlatformEnterpriseConsole } from './platform-enterprise-console';
import { PreEventCheckConsole } from './pre-event-check-console';
import { SpectatorSettingsConsole } from './spectator-settings-console';
import { BackupRecoveryConsole } from './backup-recovery-console';
import { BluetoothDeviceConsole } from './bluetooth-device-console';
import { SystemHealthReportConsole } from './system-health-report-console';

const tabs = [
  {
    id: 'platform',
    label: 'Platform',
    title: 'Platform Profile',
    description: 'Branding, arena topology, local deployment mode, licensing, and support posture.',
  },
  {
    id: 'share',
    label: 'Share',
    title: 'Live Share',
    description: 'Public links, QR publishing, and controlled spectator distribution.',
  },
  {
    id: 'spectator',
    label: 'Spectator',
    title: 'Spectator Studio',
    description: 'Configure the live scoreboard layout, visibility rules, and public viewing behavior.',
  },
  {
    id: 'readiness-policy',
    label: 'Readiness Policy',
    title: 'Event Readiness Policy',
    description: 'Define go-live rules, fallback posture, and minimum operational thresholds for the event.',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    title: 'Hardware & vMix',
    description: 'ALGE connection settings, parser rules, diagnostics, and broadcast automation.',
  },
  {
    id: 'pre-event',
    label: 'Pre-Event Test',
    title: 'Pre-Event Test Connection',
    description: 'Step-by-step live readiness checks with realtime pass, warn, and fail states.',
  },
  {
    id: 'health-report',
    label: 'Health Report',
    title: 'System Health Report',
    description: 'Generate, review, and download a deep technical report for the entire installation.',
  },
  {
    id: 'hardware-discovery',
    label: 'Hardware Discovery',
    title: 'Hardware Port Discovery',
    description: 'Scan the local machine for serial devices and identify the likely ALGE timing master path.',
  },
  {
    id: 'backup-recovery',
    label: 'Backup & Recovery',
    title: 'Backup and Recovery',
    description: 'Generate a full backup pack and run controlled recovery actions from one place.',
  },
  {
    id: 'bluetooth-mobile',
    label: 'Bluetooth & Mobile',
    title: 'Bluetooth and Mobile Access',
    description: 'Register nearby Bluetooth devices and prepare QR-based mobile control over the same local network.',
  },
  {
    id: 'overlay',
    label: 'Overlay',
    title: 'Overlay Studio',
    description: 'Broadcast overlay styling, widget composition, and on-screen presentation.',
  },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function SettingsWorkspace() {
  const [activeTab, setActiveTab] = useState<TabId>('platform');
  const active = useMemo(() => tabs.find((tab) => tab.id === activeTab) ?? tabs[0], [activeTab]);

  return (
    <div className="section-stack">
      <div className="metric-card">
        <p className="eyebrow">Settings Navigation</p>
        <p className="panel-title">Feature-specific configuration tabs</p>
        <p className="muted" style={{ marginTop: 0 }}>
          Each settings area is separated into its own sub-tab so configuration work stays compact and easier to manage during venue setup.
        </p>
        <div className="admin-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="metric-card surface-soft">
        <p className="eyebrow">Current Section</p>
        <p className="panel-title">{active.title}</p>
        <p className="muted" style={{ marginTop: 0 }}>{active.description}</p>
      </div>

      {activeTab === 'platform' ? <PlatformEnterpriseConsole /> : null}
      {activeTab === 'share' ? <LiveShareConsole /> : null}
      {activeTab === 'spectator' ? <SpectatorSettingsConsole /> : null}
      {activeTab === 'readiness-policy' ? <EventReadinessConsole /> : null}
      {activeTab === 'integrations' ? <IntegrationConsole /> : null}
      {activeTab === 'pre-event' ? <PreEventCheckConsole /> : null}
      {activeTab === 'health-report' ? <SystemHealthReportConsole /> : null}
      {activeTab === 'hardware-discovery' ? <HardwareDiscoveryConsole /> : null}
      {activeTab === 'backup-recovery' ? <BackupRecoveryConsole /> : null}
      {activeTab === 'bluetooth-mobile' ? <BluetoothDeviceConsole /> : null}
      {activeTab === 'overlay' ? <OverlayStudio /> : null}
    </div>
  );
}
