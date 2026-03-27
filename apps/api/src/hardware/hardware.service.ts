import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import {
  MockTimingHardwareAdapter,
  buildParserPipelineFromRules,
  type ParserPipeline,
  SerialTimingHardwareAdapter,
  TcpTimingHardwareAdapter,
  type TimingHardwareAdapter,
} from '@horse-timer/hardware-adapters';
import { SerialPort } from 'serialport';
import { addHardwareDiagnostic, demoStore } from '../common/demo-store';
import { RuntimeStateService } from '../persistence/runtime-state.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { SettingsService } from '../settings/settings.service';
import { TimingService } from '../timing/timing.service';
import type { HardwareCommissioningReport, HardwareParserTestResult, HardwareTelemetrySnapshot } from '@horse-timer/types';

@Injectable()
export class HardwareService implements OnModuleInit {
  private adapter!: TimingHardwareAdapter;
  private parser!: ParserPipeline;
  private readonly rawLog: Array<Record<string, unknown>> = [];

  constructor(
    @Inject(TimingService) private readonly timingService: TimingService,
    @Inject(RealtimeGateway) private readonly realtimeGateway: RealtimeGateway,
    @Inject(SettingsService) private readonly settingsService: SettingsService,
    @Inject(RuntimeStateService) private readonly runtimeStateService: RuntimeStateService,
  ) {}

  async onModuleInit(): Promise<void> {
    demoStore.hardwareDiagnostics = await this.runtimeStateService.loadDiagnostics();
    this.rebuildIntegrationRuntime();
    if (demoStore.integrations.hardware.autoConnectOnBoot) {
      await this.safeConnect('module-init');
    } else {
      this.broadcastHardwareState();
    }
  }

  private ensureRuntimeInitialized() {
    if (!this.adapter || !this.parser) {
      this.rebuildIntegrationRuntime();
    }
  }

  private createAdapter(): TimingHardwareAdapter {
    const hardware = this.settingsService.getIntegrationSettings().hardware;
    if (hardware.adapterMode === 'serial') {
      return new SerialTimingHardwareAdapter(hardware.serialPort);
    }
    if (hardware.adapterMode === 'tcp') {
      return new TcpTimingHardwareAdapter(hardware.tcpHost, hardware.tcpPort, hardware.lineDelimiter);
    }
    return new MockTimingHardwareAdapter();
  }

  private bindAdapter() {
    this.adapter.onRawData((message) => {
      this.processRawMessage(message);
    });
  }

  private processRawMessage(message: { source: 'serial' | 'usb-serial' | 'tcp'; port: string; payload: string; receivedAt: string }) {
    this.ensureRuntimeInitialized();
    const parsed = this.parser.parse(message.payload, message.source);
    this.rawLog.unshift({
      ...message,
      parsed,
    });

    if (this.rawLog.length > 200) {
      this.rawLog.length = 200;
    }

    if ((parsed.type === 'TRIGGER' || parsed.type === 'FINISH') && parsed.channel) {
      this.timingService.registerSensorTrigger(parsed.channel, parsed.rawPayload, message.receivedAt);
    } else if (parsed.type === 'UNKNOWN') {
      const entry = addHardwareDiagnostic('warn', `Unparsed hardware payload received: ${message.payload}`);
      void this.runtimeStateService.saveDiagnostic(entry);
    }

    this.broadcastHardwareState();
  }

  private async safeConnect(reason: string) {
    this.ensureRuntimeInitialized();
    try {
      await this.adapter.connect();
      const entry = addHardwareDiagnostic('info', `Hardware adapter connected (${reason}).`);
      void this.runtimeStateService.saveDiagnostic(entry);
    } catch (error) {
      demoStore.hardwareDisconnectCount += 1;
      const entry = addHardwareDiagnostic('error', `Hardware adapter connection failed (${reason}): ${String(error)}`);
      void this.runtimeStateService.saveDiagnostic(entry);
    }
    this.broadcastHardwareState();
  }

  private broadcastHardwareState() {
    this.realtimeGateway.broadcast('hardware.status.updated', this.getTelemetry());
  }

  private rebuildIntegrationRuntime() {
    this.adapter = this.createAdapter();
    this.parser = buildParserPipelineFromRules(this.settingsService.getIntegrationSettings().hardware.parserRules);
    this.bindAdapter();
  }

  async connect() {
    await this.safeConnect('manual-connect');
    return this.getStatus();
  }

  async disconnect() {
    this.ensureRuntimeInitialized();
    await this.adapter.disconnect();
    demoStore.hardwareDisconnectCount += 1;
    const entry = addHardwareDiagnostic('warn', 'Hardware adapter disconnected by operator.');
    void this.runtimeStateService.saveDiagnostic(entry);
    this.broadcastHardwareState();
    return this.getStatus();
  }

  reconfigure() {
    this.ensureRuntimeInitialized();
    void this.adapter.disconnect().catch(() => undefined);
    this.rebuildIntegrationRuntime();
    if (demoStore.integrations.hardware.autoConnectOnBoot) {
      void this.safeConnect('settings-update');
    } else {
      this.broadcastHardwareState();
    }
    return this.getStatus();
  }

  async restartRuntime() {
    this.ensureRuntimeInitialized();
    await this.adapter.disconnect().catch(() => undefined);
    this.rebuildIntegrationRuntime();
    if (this.settingsService.getIntegrationSettings().hardware.autoConnectOnBoot) {
      await this.safeConnect('runtime-restart');
    } else {
      this.broadcastHardwareState();
    }
    return this.getStatus();
  }

  getStatus() {
    this.ensureRuntimeInitialized();
    const adapterStatus = this.adapter.getStatus();
    const source: 'simulated' | 'physical' = adapterStatus.mode === 'mock' ? 'simulated' : 'physical';
    return {
      ...adapterStatus,
      diagnostics: demoStore.hardwareDiagnostics.slice(0, 10),
      parserRuleCount: demoStore.integrations.hardware.parserRules.filter((rule) => rule.enabled).length,
      configuredForLiveTiming: adapterStatus.mode !== 'mock',
      source,
    };
  }

  getLogs() {
    this.ensureRuntimeInitialized();
    return this.rawLog;
  }

  getDiagnostics() {
    return demoStore.hardwareDiagnostics;
  }

  getTelemetry(): HardwareTelemetrySnapshot {
    this.ensureRuntimeInitialized();
    return {
      status: this.getStatus(),
      diagnostics: demoStore.hardwareDiagnostics,
      logs: this.rawLog as HardwareTelemetrySnapshot['logs'],
      counters: {
        disconnects: demoStore.hardwareDisconnectCount,
        duplicates: demoStore.duplicateSignalCount,
        diagnostics: demoStore.hardwareDiagnostics.length,
        rawMessages: this.rawLog.length,
      },
      lastMessage: (this.rawLog[0] as HardwareTelemetrySnapshot['lastMessage']) ?? null,
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  testConnection() {
    const status = this.getStatus();
    return {
      ok: status.connected,
      mode: status.mode,
      source: status.source,
      connected: status.connected,
      configuredForLiveTiming: status.configuredForLiveTiming,
      parserRuleCount: status.parserRuleCount ?? 0,
      diagnostics: demoStore.hardwareDiagnostics.slice(0, 5),
      at: new Date().toISOString(),
    };
  }

  parserTest(payload: string, source: 'serial' | 'usb-serial' | 'tcp' = 'serial'): HardwareParserTestResult {
    this.ensureRuntimeInitialized();
    const parsed = this.parser.parse(payload, source);
    const matchedRuleCount = demoStore.integrations.hardware.parserRules.filter((rule) => rule.enabled).length;

    return {
      ok: parsed.type !== 'UNKNOWN',
      payload,
      source,
      parsed,
      matchedRuleCount,
      at: new Date().toISOString(),
    };
  }

  getCommissioningReport(): HardwareCommissioningReport {
    const settings = this.settingsService.getIntegrationSettings().hardware;
    const status = this.getStatus();
    const telemetry = this.getTelemetry();
    const lastMessage = telemetry.lastMessage;
    const checks = [
      {
        id: 'mode',
        title: 'Select the correct hardware mode',
        status: settings.adapterMode === 'mock' ? 'warn' : 'pass',
        detail:
          settings.adapterMode === 'mock'
            ? 'System is currently in mock mode. This is useful for rehearsal, but not a live ALGE connection.'
            : `System is configured for ${settings.adapterMode} hardware mode.`,
        action: 'Open Integrations and switch to Serial or TCP if you want a physical hardware link.',
      },
      {
        id: 'transport',
        title: 'Enter connection details',
        status:
          settings.adapterMode === 'serial'
            ? settings.serialPort.trim()
              ? 'pass'
              : 'fail'
            : settings.adapterMode === 'tcp'
              ? settings.tcpHost.trim() && settings.tcpPort > 0
                ? 'pass'
                : 'fail'
              : 'warn',
        detail:
          settings.adapterMode === 'serial'
            ? settings.serialPort.trim()
              ? `Serial port is set to ${settings.serialPort}.`
              : 'No serial port is configured.'
            : settings.adapterMode === 'tcp'
              ? settings.tcpHost.trim() && settings.tcpPort > 0
                ? `TCP target is ${settings.tcpHost}:${settings.tcpPort}.`
                : 'TCP host or port is missing.'
              : 'Mock mode does not require a physical transport target.',
        action: 'Enter the correct serial port or TCP host and port, then save the hardware settings.',
      },
      {
        id: 'parser',
        title: 'Verify parser rules',
        status: (status.parserRuleCount ?? 0) > 0 ? 'pass' : 'fail',
        detail: `${status.parserRuleCount ?? 0} enabled parser rule(s) are configured for this hardware path.`,
        action: 'Enable or create parser rules and test a sample payload before going live.',
      },
      {
        id: 'connect',
        title: 'Open the connection',
        status: status.connected ? 'pass' : settings.adapterMode === 'mock' ? 'warn' : 'fail',
        detail: status.connected ? 'The software currently has an open hardware connection.' : 'The hardware connection is not currently open.',
        action: 'Press Connect in the Hardware Console and then run Test Connection.',
      },
      {
        id: 'signal',
        title: 'Receive a real signal',
        status: lastMessage?.payload ? 'pass' : settings.adapterMode === 'mock' ? 'warn' : 'fail',
        detail: lastMessage?.payload
          ? `Latest payload received: ${lastMessage.payload}`
          : 'No hardware payload has been received yet in this session.',
        action: 'Trigger a real beam or input pulse and confirm that a raw payload appears in the hardware log.',
      },
      {
        id: 'parse-live',
        title: 'Confirm live parsing',
        status: lastMessage?.parsed?.type && lastMessage.parsed.type !== 'UNKNOWN' ? 'pass' : lastMessage?.payload ? 'fail' : settings.adapterMode === 'mock' ? 'warn' : 'fail',
        detail:
          lastMessage?.parsed?.type && lastMessage.parsed.type !== 'UNKNOWN'
            ? `Latest signal parsed as ${lastMessage.parsed.type}${lastMessage.parsed.channel ? ` on ${lastMessage.parsed.channel}` : ''}.`
            : lastMessage?.payload
              ? 'A raw payload was received, but it did not parse into a known timing signal.'
              : 'No parsed live signal is available yet.',
        action: 'If a payload is visible but not parsed, copy it into the parser tester and refine the parser rules.',
      },
    ] as const;

    const overallStatus = checks.some((item) => item.status === 'fail')
      ? 'fail'
      : checks.some((item) => item.status === 'warn')
        ? 'warn'
        : 'pass';

    return {
      generatedAt: new Date().toISOString(),
      overallStatus,
      summary:
        overallStatus === 'pass'
          ? 'Hardware connection has passed all commissioning checks.'
          : overallStatus === 'warn'
            ? 'Hardware path is partially validated, but still needs review before live use.'
            : 'Hardware commissioning is incomplete. Resolve the failed steps before starting the event.',
      checks: [...checks],
    };
  }

  async verifyCurrentLink() {
    const test = this.testConnection();
    return {
      test,
      commissioning: this.getCommissioningReport(),
      telemetry: this.getTelemetry(),
      at: new Date().toISOString(),
    };
  }

  async testSignal(payload = 'TRIG', channel = 'C0') {
    this.ensureRuntimeInitialized();
    const rawPayload = `${channel} ${payload}`;
    if (this.adapter instanceof MockTimingHardwareAdapter) {
      if (!this.adapter.isConnected()) {
        await this.adapter.connect();
        const connectEntry = addHardwareDiagnostic('info', 'Mock hardware adapter auto-connected for simulator signal injection.');
        void this.runtimeStateService.saveDiagnostic(connectEntry);
      }
      await this.adapter.inject(payload, channel);
      const entry = addHardwareDiagnostic('info', `Mock hardware signal injected on ${channel}: ${payload}`);
      void this.runtimeStateService.saveDiagnostic(entry);
    } else {
      this.processRawMessage({
        source: 'tcp',
        port: 'simulator://manual-inject',
        payload: rawPayload,
        receivedAt: new Date().toISOString(),
      });
      const entry = addHardwareDiagnostic('info', `Simulator signal injected while ${this.adapter.getStatus().mode} adapter is active: ${rawPayload}`);
      void this.runtimeStateService.saveDiagnostic(entry);
    }
    this.broadcastHardwareState();
    return {
      ok: true,
      adapter: this.getStatus(),
    };
  }

  async listSerialPorts() {
    try {
      const ports = await SerialPort.list();
      return {
        ok: true,
        ports: ports.map((port) => ({
          path: port.path,
          manufacturer: port.manufacturer ?? '',
          serialNumber: port.serialNumber ?? '',
          vendorId: port.vendorId ?? '',
          productId: port.productId ?? '',
          friendlyName: [port.manufacturer, port.path].filter(Boolean).join(' - ') || port.path,
        })),
        at: new Date().toISOString(),
      };
    } catch (error) {
      const entry = addHardwareDiagnostic('warn', `Serial port discovery failed: ${String(error)}`);
      void this.runtimeStateService.saveDiagnostic(entry);
      return {
        ok: false,
        ports: [],
        reason: String(error),
        at: new Date().toISOString(),
      };
    }
  }
}
