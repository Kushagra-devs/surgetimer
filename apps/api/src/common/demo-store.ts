import type {
  AppSettings,
  AppUser,
  ArenaProfile,
  AuditEntry,
  HardwareDiagnosticEntry,
  IncidentEntry,
  IntegrationSettings,
  OverlayCustomization,
  ReportSummary,
  VmixCommandResult,
  WidgetDefinition,
} from '@horse-timer/types';

export type DemoEvent = {
  id: string;
  name: string;
  venue: string;
  timezone: string;
  status: string;
  arenaIds: string[];
  eventCode: string;
};

export type DemoClass = {
  id: string;
  eventId: string;
  name: string;
  code: string;
};

export type DemoCompetitor = {
  id: string;
  classId: string;
  riderName: string;
  horseName: string;
  bibNumber: string;
  startOrder: number;
  status: 'QUEUED' | 'READY' | 'COMPLETED';
};

function createAuditEntry(action: string, entityType: string, entityId: string, actor = 'super-admin@surgetimer.local'): AuditEntry {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    actor,
    action,
    entityType,
    entityId,
    createdAt: new Date().toISOString(),
  };
}

export const demoStore = {
  arenas: [
    {
      id: 'arena-grand',
      name: 'Grand Arena',
      locationLabel: 'Main competition bowl',
      status: 'ACTIVE',
      surfaceType: 'Sand',
      supportsBroadcast: true,
      notes: 'Primary televised arena for feature classes.',
    },
    {
      id: 'arena-schooling',
      name: 'Schooling Arena',
      locationLabel: 'Warm-up and secondary competition zone',
      status: 'STANDBY',
      surfaceType: 'Fiber mix',
      supportsBroadcast: false,
      notes: 'Used for warm-up sessions and overflow scheduling.',
    },
  ] as ArenaProfile[],
  events: [
    {
      id: 'event-demo',
      name: 'Demo Grand Prix',
      venue: 'Surge Arena',
      timezone: 'Asia/Kolkata',
      status: 'ACTIVE',
      arenaIds: ['arena-grand', 'arena-schooling'],
      eventCode: 'SGP-2026',
    },
  ] as DemoEvent[],
  classes: [
    {
      id: 'class-demo',
      eventId: 'event-demo',
      name: '1.40m Grand Prix',
      code: 'GP140',
    },
    {
      id: 'class-speed',
      eventId: 'event-demo',
      name: '1.20m Speed Challenge',
      code: 'SPD120',
    },
  ] as DemoClass[],
  competitors: [
    {
      id: 'entry-1',
      classId: 'class-demo',
      riderName: 'Aarav Mehta',
      horseName: 'Silver Comet',
      bibNumber: '101',
      startOrder: 1,
      status: 'READY',
    },
    {
      id: 'entry-2',
      classId: 'class-demo',
      riderName: 'Naina Kapoor',
      horseName: 'Royal Ember',
      bibNumber: '102',
      startOrder: 2,
      status: 'QUEUED',
    },
    {
      id: 'entry-3',
      classId: 'class-speed',
      riderName: 'Vihaan Suri',
      horseName: 'Night Anthem',
      bibNumber: '201',
      startOrder: 1,
      status: 'QUEUED',
    },
  ] as DemoCompetitor[],
  users: [
    {
      id: 'user-super-admin',
      name: 'Surge Super Admin',
      email: 'super-admin@surgetimer.local',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
    {
      id: 'user-judge',
      name: 'Lead Judge',
      email: 'judge@surgetimer.local',
      role: 'JUDGE',
      status: 'ACTIVE',
    },
    {
      id: 'user-operator',
      name: 'Arena Operator',
      email: 'operator@surgetimer.local',
      role: 'OPERATOR',
      status: 'ACTIVE',
    },
  ] as AppUser[],
  settings: {
    venueName: 'Surge Arena',
    timezone: 'Asia/Kolkata',
    timerMode: 'SEQUENTIAL_GENERIC',
    sensorDebounceMs: 250,
    warmupDurationSec: 45,
    maxRoundDurationSec: 300,
    startSensor: 'C0',
    mainStartSensor: 'C1',
    finishSensor: 'C2',
    overlayAutoRefreshMs: 200,
    widgetWidth: 720,
    widgetHeight: 260,
    widgetAlwaysOnTopHint: true,
    arenas: [
      {
        id: 'arena-grand',
        name: 'Grand Arena',
        locationLabel: 'Main competition bowl',
        status: 'ACTIVE',
        surfaceType: 'Sand',
        supportsBroadcast: true,
        notes: 'Primary televised arena for feature classes.',
      },
      {
        id: 'arena-schooling',
        name: 'Schooling Arena',
        locationLabel: 'Warm-up and secondary competition zone',
        status: 'STANDBY',
        surfaceType: 'Fiber mix',
        supportsBroadcast: false,
        notes: 'Used for warm-up sessions and overflow scheduling.',
      },
    ],
    activeArenaId: 'arena-grand',
    branding: {
      organizationName: 'Surge Sports Systems',
      productLabel: 'SurgeTimer Venue Edition',
      shortLabel: 'SurgeTimer',
      primaryColor: '#0f7cff',
      secondaryColor: '#0b5ed7',
      appBackground: '#f6f8fb',
      logoText: 'ST',
      supportEmail: 'support@surgetimer.local',
      supportPhone: '+91 80000 00000',
    },
    deployment: {
      mode: 'LOCAL_LAN',
      siteLabel: 'Surge Arena Control Room',
      applianceName: 'SurgeTimer Venue Node',
      localHostname: 'surgetimer.local',
      localBaseUrl: 'https://surgetimer.vercel.app',
      enforceLanOnly: true,
      cacheCriticalRoutes: true,
      autoReconnectHardware: true,
      backupExportPath: '/var/surgetimer/backups',
    },
    license: {
      licenseKey: 'ST-VE-2026-DEMO',
      licensedTo: 'Surge Arena Demo Venue',
      deploymentId: 'deployment-demo-001',
      supportTier: 'EVENT_CRITICAL',
      validUntil: '2027-03-31T00:00:00.000Z',
      maxArenas: 4,
      maxOperatorSeats: 12,
      diagnosticsSharingApproved: true,
    },
    support: {
      remoteAssistEnabled: true,
      diagnosticsBundleRetentionDays: 30,
      includeAuditInDiagnostics: true,
      includeHardwareLogsInDiagnostics: true,
      includeIntegrationSnapshotInDiagnostics: true,
      incidentHotline: '+91 80000 11111',
      serviceWindow: '24x7 during live event days',
    },
    readinessPolicy: {
      requirePhysicalHardware: true,
      requirePersistenceForGoLive: false,
      requireQueueReadyCompetitor: true,
      minimumReadyCompetitors: 1,
      requireParserRules: true,
      requireSpectatorLinkValidation: false,
      requireVmixIfBroadcastArena: false,
      allowManualFallbackStart: true,
      freezeConfigurationDuringLiveRound: true,
    },
    spectator: {
      enabled: true,
      publicBaseUrl: 'https://surgetimer.vercel.app',
      requireToken: false,
      shareToken: 'surge-live-2026',
      title: 'Live Arena Scoreboard',
      subtitle: 'Scan to follow the live round timer, current competitor, and completed results.',
      accentColor: '#6bc6ff',
      backgroundColor: '#08111b',
      textColor: '#f8fafc',
      cardOpacity: 0.78,
      historyLimit: 24,
      autoRefreshMs: 900,
      useRealtimeSocket: true,
      showEventName: true,
      showClassName: true,
      showHorseName: true,
      showPenalties: true,
      showSponsor: true,
      showActiveTimeline: true,
      showRunHistory: true,
      showUpdatedAt: true,
      showQueuePreview: true,
      queuePreviewSize: 3,
      showScanHelp: true,
    },
  } as AppSettings,
  integrations: {
    hardware: {
      adapterMode: 'serial',
      autoConnectOnBoot: false,
      serialPort: '/dev/ttyUSB0',
      tcpHost: '127.0.0.1',
      tcpPort: 2000,
      lineDelimiter: 'LF',
      parserRules: [
        {
          id: 'rule-trigger-default',
          enabled: true,
          type: 'TRIGGER',
          pattern: '(?<channel>C\\d+)\\s+TRIG(?:GER)?(?:\\s+(?<timestamp>[\\d:.TZ-]+))?',
          channelGroupName: 'channel',
          timestampGroupName: 'timestamp',
          sourceFilter: 'any',
        },
        {
          id: 'rule-finish-default',
          enabled: true,
          type: 'FINISH',
          pattern: '(?<channel>C\\d+)\\s+FINISH(?:\\s+(?<timestamp>[\\d:.TZ-]+))?',
          channelGroupName: 'channel',
          timestampGroupName: 'timestamp',
          sourceFilter: 'any',
        },
      ],
      alarmOnDisconnect: true,
      strictChannelMapping: false,
    },
    vmix: {
      enabled: false,
      baseUrl: 'http://127.0.0.1:8088/api',
      inputName: 'HorseTimerOverlay',
      titleField: 'Text',
      autoTriggerOnStateChange: false,
      triggerPreset: 'NONE',
      triggerValue: '',
      dataSourcePath: './data/vmix-overlay.csv',
    },
  } as IntegrationSettings,
  overlayCustomization: {
    themeName: 'Executive Blue',
    transparentBackground: true,
    compactMode: false,
    autoScale: true,
    compactMetaMode: 'AUTO',
    showPenalties: true,
    showSponsor: true,
    showLogo: true,
    showClassName: true,
    showHorseName: true,
    showStateBadge: true,
    fontScale: 1,
    minFontScale: 0.72,
    maxFontScale: 1.12,
    accentColor: '#6bc6ff',
    textColor: '#fbfdff',
    backgroundColor: 'rgba(4,11,18,0.90)',
    panelOpacity: 0.92,
    borderRadius: 34,
    contentGap: 24,
    paddingX: 34,
    paddingY: 34,
    timerAlign: 'LEFT',
    stackBelowWidth: 760,
    collapseMetaBelowWidth: 560,
    hideSponsorBelowWidth: 460,
    hideLogoBelowWidth: 420,
    layout: 'BROADCAST',
    logoText: 'SURGE',
    sponsorText: 'Official Broadcast Partner',
  } as OverlayCustomization,
  widgets: [
    {
      id: 'widget-timer-primary',
      name: 'Primary Timer Widget',
      kind: 'TIMER',
      status: 'ACTIVE',
      route: '/overlay/widget?widget=widget-timer-primary',
      width: 780,
      height: 280,
      title: 'Live Arena Timer',
      subtitle: 'Primary competition clock',
      body: 'Shows live timer, competitor, horse, class, penalties, sponsor, and branding.',
      accentColor: '#6bc6ff',
      backgroundColor: 'rgba(4,11,18,0.90)',
      textColor: '#fbfdff',
      sponsorName: 'Official Broadcast Partner',
      mediaLabel: 'Primary Timer',
      ctaLabel: 'Capture in vMix',
      removable: false,
      transparentBackground: true,
    },
    {
      id: 'widget-sponsor-rail',
      name: 'Sponsor Rail Widget',
      kind: 'SPONSOR',
      status: 'ACTIVE',
      route: '/overlay/widget?widget=widget-sponsor-rail',
      width: 720,
      height: 180,
      title: 'Presented By Surge Equine',
      subtitle: 'Sponsor placement widget',
      body: 'Designed for sponsor slates, arena partner branding, and side-panel placement.',
      accentColor: '#f59e0b',
      backgroundColor: 'rgba(15,23,42,0.92)',
      textColor: '#fbfdff',
      sponsorName: 'Surge Equine',
      mediaLabel: 'Sponsor Placement',
      ctaLabel: 'Run Sponsor',
      removable: true,
      transparentBackground: true,
    },
    {
      id: 'widget-brand-ad',
      name: 'Brand Advertisement Widget',
      kind: 'ADVERTISEMENT',
      status: 'DRAFT',
      route: '/overlay/widget?widget=widget-brand-ad',
      width: 820,
      height: 260,
      title: 'Weekend Feature Promotion',
      subtitle: 'Advertisement creative slot',
      body: 'Use for premium partner ads, upcoming class promos, lower-third campaigns, or desktop signage.',
      accentColor: '#34d399',
      backgroundColor: 'rgba(8,20,24,0.92)',
      textColor: '#f8fafc',
      sponsorName: 'Featured Partner',
      mediaLabel: 'Ad Creative',
      ctaLabel: 'Book Now',
      removable: true,
      transparentBackground: true,
    },
  ] as WidgetDefinition[],
  auditLogs: [
    createAuditEntry('SYSTEM_BOOTSTRAP', 'SYSTEM', 'surgetimer'),
    createAuditEntry('OVERLAY_THEME_LOADED', 'OVERLAY', 'default'),
  ] as AuditEntry[],
  hardwareDiagnostics: [
    {
      id: 'diag-boot',
      level: 'info',
      message: 'Hardware integration bootstrap completed.',
      createdAt: new Date().toISOString(),
    },
  ] as HardwareDiagnosticEntry[],
  vmixTelemetry: [] as VmixCommandResult[],
  incidents: [
    {
      id: 'incident-bootstrap',
      title: 'Initial commissioning required',
      detail: 'Validate physical ALGE hardware, parser rules, and go-live posture before the first live class.',
      level: 'warn',
      source: 'SYSTEM',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      notes: 'Generated by default until the first full pre-event test is completed.',
    },
  ] as IncidentEntry[],
  hardwareDisconnectCount: 0,
  duplicateSignalCount: 0,
};

export function addAudit(action: string, entityType: string, entityId: string, actor?: string) {
  demoStore.auditLogs.unshift(createAuditEntry(action, entityType, entityId, actor));
}

export function getReportSummary(): ReportSummary {
  return {
    totalEvents: demoStore.events.length,
    activeEvents: demoStore.events.filter((event) => event.status === 'ACTIVE').length,
    totalClasses: demoStore.classes.length,
    totalCompetitors: demoStore.competitors.length,
    totalArenas: demoStore.arenas.length,
    completedRuns: demoStore.competitors.filter((competitor) => competitor.status === 'COMPLETED').length,
    hardwareDisconnects: demoStore.hardwareDisconnectCount,
    duplicateSignals: demoStore.duplicateSignalCount,
  };
}

export function addHardwareDiagnostic(level: HardwareDiagnosticEntry['level'], message: string) {
  const entry = {
    id: `diag-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    level,
    message,
    createdAt: new Date().toISOString(),
  } satisfies HardwareDiagnosticEntry;
  demoStore.hardwareDiagnostics.unshift(entry);
  demoStore.hardwareDiagnostics = demoStore.hardwareDiagnostics.slice(0, 50);
  return entry;
}

export function addIncident(entry: Omit<IncidentEntry, 'id' | 'createdAt' | 'status'> & { status?: IncidentEntry['status'] }) {
  const incident = {
    id: `incident-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    status: entry.status ?? 'OPEN',
    ...entry,
  } satisfies IncidentEntry;
  demoStore.incidents.unshift(incident);
  demoStore.incidents = demoStore.incidents.slice(0, 100);
  return incident;
}
