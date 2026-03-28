export const TimerState = {
  IDLE: 'IDLE',
  READY: 'READY',
  WARMUP_RUNNING: 'WARMUP_RUNNING',
  WARMUP_PAUSED: 'WARMUP_PAUSED',
  ROUND_RUNNING: 'ROUND_RUNNING',
  ROUND_PAUSED: 'ROUND_PAUSED',
  FINISH_PENDING_CONFIRMATION: 'FINISH_PENDING_CONFIRMATION',
  COMPLETED: 'COMPLETED',
  ABORTED: 'ABORTED',
  HOLD: 'HOLD',
} as const;

export type TimerState = (typeof TimerState)[keyof typeof TimerState];

export type TimingEvent =
  | { type: 'COMPETITOR_ARMED'; competitorId: string; userId: string; at: string }
  | { type: 'SENSOR_TRIGGER'; channel: string; rawPayload: string; at: string }
  | { type: 'MANUAL_WARMUP_START'; userId: string; at: string }
  | { type: 'MANUAL_MAIN_START'; userId: string; at: string }
  | { type: 'MANUAL_STOP'; userId: string; at: string }
  | { type: 'PAUSE'; userId: string; at: string }
  | { type: 'RESUME'; userId: string; at: string }
  | { type: 'RESET'; userId: string; at: string }
  | { type: 'ABORT'; userId: string; at: string; reason?: string }
  | { type: 'FINISH_TRIGGER'; channel: string; rawPayload: string; at: string }
  | { type: 'MAX_TIME_REACHED'; at: string };

export type TimingMode = 'SEQUENTIAL_GENERIC' | 'MAPPED_CHANNELS';

export type TimerConfig = {
  sensorDebounceMs: number;
  warmupDurationSec: number;
  maxRoundDurationSec: number;
  mode: TimingMode;
  startSensor: string;
  mainStartSensor: string;
  finishSensor: string;
};

export type TriggerRecord = {
  channel: string;
  at: string;
  rawPayload: string;
};

export type TimingContext = {
  competitorId: string | null;
  armedByUserId: string | null;
  armedAt: string | null;
  triggerCount: number;
  warmupStartedAt: string | null;
  warmupEndsAt: string | null;
  mainStartedAt: string | null;
  mainEndsAt: string | null;
  completedAt: string | null;
  pausedAt: string | null;
  abortReason: string | null;
  manualOverrideUsed: boolean;
  lastTriggerByChannel: Record<string, string>;
  lastSensorMessage: TriggerRecord | null;
  finishReason: 'FINISH_TRIGGER' | 'MANUAL_STOP' | 'MAX_TIME_REACHED' | null;
  warnings: string[];
};

export type TimerSnapshot = {
  state: TimerState;
  context: TimingContext;
};

export type ReducerResult = {
  snapshot: TimerSnapshot;
  accepted: boolean;
  reason?: string;
  effects: TimingEffect[];
};

export type TimingEffect =
  | { type: 'LOG'; level: 'info' | 'warn'; message: string }
  | { type: 'RUN_COMPLETED'; at: string; reason: NonNullable<TimingContext['finishReason']> }
  | { type: 'TIMER_STARTED'; timer: 'WARMUP' | 'MAIN'; at: string }
  | { type: 'TIMER_PAUSED'; timer: 'WARMUP' | 'MAIN'; at: string }
  | { type: 'TIMER_RESUMED'; timer: 'WARMUP' | 'MAIN'; at: string };

export type RealtimeEnvelope<TPayload> = {
  version: 1;
  type: string;
  emittedAt: string;
  payload: TPayload;
};

export type RawHardwareMessage = {
  source: 'serial' | 'usb-serial' | 'tcp';
  port: string;
  payload: string;
  receivedAt: string;
};

export type ParsedTimingSignal = {
  type: 'TRIGGER' | 'FINISH' | 'UNKNOWN';
  channel?: string;
  hardwareTimestamp?: string;
  rawPayload: string;
};

export type HardwareStatus = {
  connected: boolean;
  mode: 'mock' | 'serial' | 'tcp';
  source: 'simulated' | 'physical';
  configuredForLiveTiming: boolean;
  details?: string;
  lastMessageAt?: string;
  diagnostics?: HardwareDiagnosticEntry[];
  parserRuleCount?: number;
};

export type HardwareLogEntry = {
  source: 'serial' | 'usb-serial' | 'tcp';
  port: string;
  payload: string;
  receivedAt: string;
  parsed?: ParsedTimingSignal | null;
};

export type HardwareTelemetrySnapshot = {
  status: HardwareStatus;
  diagnostics: HardwareDiagnosticEntry[];
  logs: HardwareLogEntry[];
  counters: {
    disconnects: number;
    duplicates: number;
    diagnostics: number;
    rawMessages: number;
  };
  lastMessage: HardwareLogEntry | null;
  lastUpdatedAt: string;
};

export type HardwareParserTestResult = {
  ok: boolean;
  payload: string;
  source: RawHardwareMessage['source'];
  parsed: ParsedTimingSignal | null;
  matchedRuleCount: number;
  at: string;
};

export type HardwareCommissioningStep = {
  id: string;
  title: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
  action: string;
};

export type HardwareCommissioningReport = {
  generatedAt: string;
  overallStatus: 'pass' | 'warn' | 'fail';
  summary: string;
  checks: HardwareCommissioningStep[];
};

export type MobileControlDeviceInfo = {
  userAgent: string;
  platform: string;
  language: string;
  viewport: string;
};

export type MobileControlLocation = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  capturedAt: string;
};

export type MobileControlSessionView = {
  id: string;
  name: string;
  createdAt: string;
  lastSeenAt: string;
  ipAddress: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  insideCampus: boolean;
  distanceMeters: number;
  device: MobileControlDeviceInfo;
  location: MobileControlLocation;
};

export type MobileControlCampusPolicy = {
  venueName: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  maxConcurrentUsers: number;
};

export type MobileControlStatus = {
  hasActiveCode: boolean;
  expiresAt: string | null;
  codePreview: string | null;
  activeUsers: number;
  slotsRemaining: number;
  campus: MobileControlCampusPolicy;
  sessions: MobileControlSessionView[];
};

export type OverlayView = {
  timerState: TimerState;
  stateLabel: 'WARMUP' | 'LIVE' | 'STOPPED' | 'FINISHED' | 'HOLD' | 'READY' | 'IDLE';
  riderName: string;
  horseName: string;
  className: string;
  competitorNumber: string;
  elapsedMs: number;
  penalties: string;
  sponsorName: string;
  logoUrl: string;
  snapshot?: TimerSnapshot;
};

export type AppUserRole = 'SUPER_ADMIN' | 'ADMIN' | 'JUDGE' | 'OPERATOR' | 'VIEWER';

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: AppUserRole;
  status: 'ACTIVE' | 'INVITED' | 'DISABLED';
};

export type ArenaProfile = {
  id: string;
  name: string;
  locationLabel: string;
  status: 'ACTIVE' | 'STANDBY' | 'MAINTENANCE';
  surfaceType: string;
  supportsBroadcast: boolean;
  notes: string;
};

export type WhiteLabelBranding = {
  organizationName: string;
  productLabel: string;
  shortLabel: string;
  primaryColor: string;
  secondaryColor: string;
  appBackground: string;
  logoText: string;
  supportEmail: string;
  supportPhone: string;
};

export type DeploymentProfile = {
  mode: 'LOCAL_LAN' | 'HYBRID';
  siteLabel: string;
  applianceName: string;
  localHostname: string;
  localBaseUrl: string;
  enforceLanOnly: boolean;
  cacheCriticalRoutes: boolean;
  autoReconnectHardware: boolean;
  backupExportPath: string;
};

export type LicenseProfile = {
  licenseKey: string;
  licensedTo: string;
  deploymentId: string;
  supportTier: 'STANDARD' | 'PRIORITY' | 'EVENT_CRITICAL';
  validUntil: string;
  maxArenas: number;
  maxOperatorSeats: number;
  diagnosticsSharingApproved: boolean;
};

export type SupportToolkit = {
  remoteAssistEnabled: boolean;
  diagnosticsBundleRetentionDays: number;
  includeAuditInDiagnostics: boolean;
  includeHardwareLogsInDiagnostics: boolean;
  includeIntegrationSnapshotInDiagnostics: boolean;
  incidentHotline: string;
  serviceWindow: string;
};

export type EventReadinessPolicy = {
  requirePhysicalHardware: boolean;
  requirePersistenceForGoLive: boolean;
  requireQueueReadyCompetitor: boolean;
  minimumReadyCompetitors: number;
  requireParserRules: boolean;
  requireSpectatorLinkValidation: boolean;
  requireVmixIfBroadcastArena: boolean;
  allowManualFallbackStart: boolean;
  freezeConfigurationDuringLiveRound: boolean;
};

export type AppSettings = {
  venueName: string;
  timezone: string;
  timerMode: TimingMode;
  sensorDebounceMs: number;
  warmupDurationSec: number;
  maxRoundDurationSec: number;
  startSensor: string;
  mainStartSensor: string;
  finishSensor: string;
  overlayAutoRefreshMs: number;
  widgetWidth: number;
  widgetHeight: number;
  widgetAlwaysOnTopHint: boolean;
  arenas: ArenaProfile[];
  activeArenaId: string;
  branding: WhiteLabelBranding;
  deployment: DeploymentProfile;
  license: LicenseProfile;
  support: SupportToolkit;
  readinessPolicy: EventReadinessPolicy;
  spectator: SpectatorSettings;
};

export type SpectatorSettings = {
  enabled: boolean;
  publicBaseUrl: string;
  requireToken: boolean;
  shareToken: string;
  title: string;
  subtitle: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  cardOpacity: number;
  historyLimit: number;
  autoRefreshMs: number;
  useRealtimeSocket: boolean;
  showEventName: boolean;
  showClassName: boolean;
  showHorseName: boolean;
  showPenalties: boolean;
  showSponsor: boolean;
  showActiveTimeline: boolean;
  showRunHistory: boolean;
  showUpdatedAt: boolean;
  showQueuePreview: boolean;
  queuePreviewSize: number;
  showScanHelp: boolean;
};

export type HardwareAdapterMode = 'mock' | 'serial' | 'tcp';

export type HardwareParserRule = {
  id: string;
  enabled: boolean;
  type: 'TRIGGER' | 'FINISH';
  pattern: string;
  channelGroupName?: string;
  timestampGroupName?: string;
  sourceFilter?: RawHardwareMessage['source'] | 'any';
};

export type HardwareIntegrationSettings = {
  adapterMode: HardwareAdapterMode;
  autoConnectOnBoot: boolean;
  serialPort: string;
  tcpHost: string;
  tcpPort: number;
  lineDelimiter: 'LF' | 'CRLF' | 'CR';
  parserRules: HardwareParserRule[];
  alarmOnDisconnect: boolean;
  strictChannelMapping: boolean;
};

export type VmixFunctionPreset =
  | 'NONE'
  | 'PLAY_INPUT'
  | 'CUT_INPUT'
  | 'FADE_INPUT'
  | 'SET_TEXT'
  | 'TRIGGER_SHORTCUT';

export type VmixIntegrationSettings = {
  enabled: boolean;
  baseUrl: string;
  inputName: string;
  titleField: string;
  autoTriggerOnStateChange: boolean;
  triggerPreset: VmixFunctionPreset;
  triggerValue: string;
  dataSourcePath: string;
};

export type IntegrationSettings = {
  hardware: HardwareIntegrationSettings;
  vmix: VmixIntegrationSettings;
};

export type OverlayCustomization = {
  themeName: string;
  transparentBackground: boolean;
  compactMode: boolean;
  autoScale: boolean;
  compactMetaMode: 'STACK' | 'INLINE' | 'AUTO';
  showPenalties: boolean;
  showSponsor: boolean;
  showLogo: boolean;
  showClassName: boolean;
  showHorseName: boolean;
  showStateBadge: boolean;
  fontScale: number;
  minFontScale: number;
  maxFontScale: number;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  panelOpacity: number;
  borderRadius: number;
  contentGap: number;
  paddingX: number;
  paddingY: number;
  timerAlign: 'LEFT' | 'CENTER';
  stackBelowWidth: number;
  collapseMetaBelowWidth: number;
  hideSponsorBelowWidth: number;
  hideLogoBelowWidth: number;
  layout: 'BROADCAST' | 'LOWER_THIRD' | 'WIDGET';
  logoText: string;
  sponsorText: string;
};

export type WidgetKind = 'TIMER' | 'ADVERTISEMENT' | 'SPONSOR' | 'CUSTOM_MESSAGE';

export type WidgetStatus = 'ACTIVE' | 'DRAFT' | 'DISABLED';

export type WidgetDefinition = {
  id: string;
  name: string;
  kind: WidgetKind;
  status: WidgetStatus;
  route: string;
  width: number;
  height: number;
  title: string;
  subtitle: string;
  body: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  sponsorName: string;
  mediaLabel: string;
  ctaLabel: string;
  removable: boolean;
  transparentBackground: boolean;
};

export type AuditEntry = {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
};

export type ReportSummary = {
  totalEvents: number;
  activeEvents: number;
  totalClasses: number;
  totalCompetitors: number;
  totalArenas: number;
  completedRuns: number;
  hardwareDisconnects: number;
  duplicateSignals: number;
};

export type HardwareDiagnosticEntry = {
  id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  createdAt: string;
};

export type RunEventTrailEntry = {
  id: string;
  at: string;
  eventType: string;
  previousState: string;
  nextState: string;
  accepted: boolean;
  reason?: string | null;
};

export type PublicRunHistoryEntry = {
  id: string;
  eventId?: string;
  classId?: string;
  state: string;
  elapsedMs: number;
  penalties?: number;
  resultCode?: string;
  notes?: string;
  snapshot?: TimerSnapshot;
  armedAt?: string | null;
  warmupStartedAt?: string | null;
  mainStartedAt?: string | null;
  mainEndedAt?: string | null;
  finishReason?: string | null;
  manualOverrideUsed?: boolean;
  warnings?: string[];
  competitor?: {
    riderName?: string;
    horseName?: string;
    bibNumber?: string;
  } | null;
  eventTrail?: RunEventTrailEntry[];
};

export type IncidentEntry = {
  id: string;
  title: string;
  detail: string;
  level: 'critical' | 'warn' | 'info';
  source: 'SYSTEM' | 'HARDWARE' | 'VMIX' | 'OPERATOR';
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
};

export type PublicLiveFeed = {
  shareUrl: string;
  updatedAt: string;
  accessDenied?: boolean;
  denialReason?: string;
  eventId?: string;
  eventName?: string;
  classId?: string;
  className?: string;
  queuePreview?: Array<{
    competitorId: string;
    riderName: string;
    horseName: string;
    bibNumber: string;
  }>;
  spectator: SpectatorSettings;
  overlay: OverlayView;
  activeRun: {
    elapsedMs: number;
    snapshot: TimerSnapshot;
    competitor?: {
      riderName?: string;
      horseName?: string;
      bibNumber?: string;
    } | null;
    eventTrail: RunEventTrailEntry[];
  };
  completedRuns: PublicRunHistoryEntry[];
};

export type VmixCommandResult = {
  ok: boolean;
  url: string;
  reason?: string;
  simulated?: boolean;
  attempts?: number;
  statusCode?: number;
  at: string;
};

export type DiagnosticsBundle = {
  generatedAt: string;
  site: {
    venueName: string;
    activeArenaId: string;
    activeArenaName: string;
    organizationName: string;
    deploymentMode: DeploymentProfile['mode'];
    localBaseUrl: string;
  };
  license: LicenseProfile;
  support: SupportToolkit;
  summary: ReportSummary;
  hardware: HardwareTelemetrySnapshot;
  integrations: IntegrationSettings;
  overlay: OverlayCustomization;
  recentAudit: AuditEntry[];
  notes: string[];
};

export type PreEventCheckItem = {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
  action: string;
};

export type PreEventCheckReport = {
  generatedAt: string;
  overallStatus: 'pass' | 'warn' | 'fail';
  summary: string;
  checks: PreEventCheckItem[];
  blockers: string[];
};

export type SystemHealthReport = {
  generatedAt: string;
  status: 'healthy' | 'degraded' | 'critical';
  executiveSummary: string;
  platformProfile: {
    product: string;
    organization: string;
    venueName: string;
    activeArena: string;
    deploymentMode: DeploymentProfile['mode'];
    localBaseUrl: string;
    lanOnly: boolean;
  };
  technicalProfile: {
    frontend: string;
    backend: string;
    realtime: string;
    persistence: string[];
    hardwareModes: string[];
    broadcast: string[];
    recoveryCapabilities: string[];
  };
  readiness: {
    postgres: boolean;
    redis: boolean;
    hardwareConnected: boolean;
    hardwareSource: HardwareStatus['source'];
    vmixEnabled: boolean;
    spectatorEnabled: boolean;
  };
  counters: ReportSummary;
  diagnostics: DiagnosticsBundle;
  recommendedActions: string[];
};
