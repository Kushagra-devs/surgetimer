import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { TimerState, VmixCommandResult } from '@horse-timer/types';
import { addAudit, demoStore } from '../common/demo-store';
import { RuntimeStateService } from '../persistence/runtime-state.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class VmixService implements OnModuleInit {
  constructor(
    @Inject(SettingsService) private readonly settingsService: SettingsService,
    @Inject(RealtimeGateway) private readonly realtimeGateway: RealtimeGateway,
    @Inject(RuntimeStateService) private readonly runtimeStateService: RuntimeStateService,
  ) {}

  async onModuleInit() {
    demoStore.vmixTelemetry = await this.runtimeStateService.loadVmixTelemetry();
  }

  getStatus() {
    const settings = this.settingsService.getIntegrationSettings().vmix;
    const health = this.getHealth();
    return {
      enabled: settings.enabled,
      baseUrl: settings.baseUrl,
      inputName: settings.inputName,
      titleField: settings.titleField,
      autoTriggerOnStateChange: settings.autoTriggerOnStateChange,
      triggerPreset: settings.triggerPreset,
      dataSourcePath: settings.dataSourcePath,
      previewUrl: this.buildOverlayInputUrl(),
      backupUrl: this.buildOverlayBackupUrl(),
      widgetUrl: this.buildWidgetCaptureUrl(),
      dataSourceJsonUrl: this.buildDataSourceJsonUrl(),
      dataSourceCsvUrl: this.buildDataSourceCsvUrl(),
      package: this.buildBroadcastPackage(),
      titleApiExample: this.buildFunctionUrl('SetText', {
        Input: settings.inputName,
        SelectedName: settings.titleField,
        Value: 'LIVE 00:45.12',
      }),
      telemetry: demoStore.vmixTelemetry.slice(0, 10),
      health,
    };
  }

  buildOverlayInputUrl() {
    return `${this.getWebBaseUrl()}/overlay/live`;
  }

  buildOverlayBackupUrl() {
    return `${this.getWebBaseUrl()}/overlay/live?theme=default&backup=1`;
  }

  buildWidgetCaptureUrl() {
    return `${this.getWebBaseUrl()}/overlay/widget?desktop=1`;
  }

  buildDataSourceJsonUrl() {
    return `${this.getApiBaseUrl()}/overlay/vmix-datasource.json`;
  }

  buildDataSourceCsvUrl() {
    return `${this.getApiBaseUrl()}/overlay/vmix-datasource.csv`;
  }

  buildFunctionUrl(functionName: string, params: Record<string, string>) {
    const baseUrl = this.settingsService.getIntegrationSettings().vmix.baseUrl.replace(/\/$/, '');
    const search = new URLSearchParams({ Function: functionName, ...params });
    return `${baseUrl}?${search.toString()}`;
  }

  async sendPreset(value?: string): Promise<VmixCommandResult> {
    const settings = this.settingsService.getIntegrationSettings().vmix;
    const triggerValue = value ?? settings.triggerValue;
    let functionName = '';
    let params: Record<string, string> = {};

    switch (settings.triggerPreset) {
      case 'PLAY_INPUT':
        functionName = 'Play';
        params = { Input: triggerValue || settings.inputName };
        break;
      case 'CUT_INPUT':
        functionName = 'Cut';
        params = { Input: triggerValue || settings.inputName };
        break;
      case 'FADE_INPUT':
        functionName = 'Fade';
        params = { Input: triggerValue || settings.inputName };
        break;
      case 'SET_TEXT':
        functionName = 'SetText';
        params = {
          Input: settings.inputName,
          SelectedName: settings.titleField,
          Value: triggerValue || 'LIVE',
        };
        break;
      case 'TRIGGER_SHORTCUT':
        functionName = 'ScriptStart';
        params = { Value: triggerValue || 'OverlayTrigger' };
        break;
      default:
        return this.recordTelemetry({
          ok: true,
          simulated: true,
          url: '',
          reason: 'No vMix trigger preset configured.',
          at: new Date().toISOString(),
          attempts: 0,
        });
    }

    const url = this.buildFunctionUrl(functionName, params);
    const result = settings.enabled ? await this.executeWithRetry(url) : {
      ok: true,
      simulated: true,
      url,
      reason: 'vMix integration disabled, command generated only.',
      at: new Date().toISOString(),
      attempts: 0,
    };

    addAudit('VMIX_PRESET_TRIGGERED', 'VMIX', settings.inputName);
    this.realtimeGateway.broadcast('overlay.updated', {
      vmixUrl: url,
      vmixResult: result,
      at: new Date().toISOString(),
    });
    return this.recordTelemetry(result);
  }

  async syncState(timerState: TimerState, timerText: string) {
    const settings = this.settingsService.getIntegrationSettings().vmix;
    if (!settings.enabled || !settings.autoTriggerOnStateChange) {
      return null;
    }
    return this.sendPreset(`${timerState} ${timerText}`);
  }

  async runTestSuite() {
    const settings = this.settingsService.getIntegrationSettings().vmix;
    const health = this.getHealth();
    const overlayRecord = this.buildDataSourceSample();
    const triggerResult = await this.sendPreset(`${overlayRecord.StateLabel} ${overlayRecord.TimerText}`);

    return {
      generatedAt: new Date().toISOString(),
      browserInput: {
        ok: !!this.buildOverlayInputUrl(),
        primaryUrl: this.buildOverlayInputUrl(),
        backupUrl: this.buildOverlayBackupUrl(),
        widgetUrl: this.buildWidgetCaptureUrl(),
      },
      dataSource: {
        ok: true,
        jsonUrl: this.buildDataSourceJsonUrl(),
        csvUrl: this.buildDataSourceCsvUrl(),
        sample: overlayRecord,
      },
      trigger: triggerResult,
      health,
      recommendations: [
        'Use the browser input URL as the primary vMix source.',
        'Use the CSV or JSON datasource as the title/data fallback path.',
        'Keep the widget or desktop capture path as an emergency backup source.',
        settings.enabled ? 'vMix automation is enabled.' : 'Enable vMix automation if you want scene or title changes triggered automatically.',
      ],
    };
  }

  getHealth() {
    const settings = this.settingsService.getIntegrationSettings().vmix;
    const last = demoStore.vmixTelemetry[0] ?? null;
    const telemetryHealthy = !last || last.ok !== false;
    const browserReady = !!this.buildOverlayInputUrl();
    const dataSourceReady = !!this.buildDataSourceCsvUrl() && !!this.buildDataSourceJsonUrl();
    const primaryMode = settings.enabled ? 'API_AUTOMATION' : 'BROWSER_ONLY';
    const hardwareConfigured = this.settingsService.getIntegrationSettings().hardware.adapterMode !== 'mock';

    return {
      primaryMode,
      browserReady,
      dataSourceReady,
      apiEnabled: settings.enabled,
      telemetryHealthy,
      hardwareReady: hardwareConfigured,
      lastCommandOk: last?.ok ?? null,
      lastCommandAt: last?.at ?? null,
      recommendedFallback: 'Use browser input first, data source second, widget/desktop capture as emergency fallback.',
      score: [browserReady, dataSourceReady, telemetryHealthy, hardwareConfigured].filter(Boolean).length * 25,
    };
  }

  buildBroadcastPackage() {
    const settings = this.settingsService.getIntegrationSettings().vmix;
    return {
      primary: {
        mode: 'WEB_BROWSER',
        url: this.buildOverlayInputUrl(),
        inputName: settings.inputName,
      },
      failover: {
        browserBackupUrl: this.buildOverlayBackupUrl(),
        widgetCaptureUrl: this.buildWidgetCaptureUrl(),
        dataSourceJsonUrl: this.buildDataSourceJsonUrl(),
        dataSourceCsvUrl: this.buildDataSourceCsvUrl(),
      },
      titleDataWorkflow: {
        fieldName: settings.titleField,
        setTextExample: this.buildFunctionUrl('SetText', {
          Input: settings.inputName,
          SelectedName: settings.titleField,
          Value: 'LIVE 00:45.12',
        }),
      },
      operatorNotes: [
        'Primary broadcast path: vMix Web Browser input using the live overlay URL.',
        'Fallback path: vMix title/data source using the CSV or JSON data source endpoint.',
        'Emergency path: capture the widget or desktop source if browser rendering fails.',
      ],
    };
  }

  private buildDataSourceSample() {
    const competitor = demoStore.competitors[0];
    return {
      UpdatedAt: new Date().toISOString(),
      TimerState: 'IDLE',
      StateLabel: 'READY',
      TimerText: '00.00',
      RiderName: competitor?.riderName ?? 'Awaiting rider',
      HorseName: competitor?.horseName ?? 'Awaiting horse',
      ClassName: demoStore.classes[0]?.name ?? 'Awaiting class',
      CompetitorNumber: competitor?.bibNumber ?? '--',
      Penalties: '0',
      SponsorName: demoStore.overlayCustomization.sponsorText,
      LogoLabel: demoStore.overlayCustomization.logoText,
      FinishWarnings: '',
    };
  }

  private getWebBaseUrl() {
    return this.settingsService.getAppSettings().deployment.localBaseUrl || 'http://localhost:3001';
  }

  private getApiBaseUrl() {
    const webBase = this.getWebBaseUrl();
    try {
      const url = new URL(webBase);
      url.port = '4000';
      return url.toString().replace(/\/$/, '');
    } catch {
      return 'http://localhost:4000';
    }
  }

  private async executeWithRetry(url: string): Promise<VmixCommandResult> {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(2500),
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return {
          ok: true,
          url,
          at: new Date().toISOString(),
          attempts: attempt,
          statusCode: response.status,
        };
      } catch (error) {
        if (attempt === maxAttempts) {
          return {
            ok: false,
            url,
            reason: String(error),
            at: new Date().toISOString(),
            attempts: attempt,
          };
        }
        await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
      }
    }

    return {
      ok: false,
      url,
      reason: 'Unknown vMix execution failure.',
      at: new Date().toISOString(),
      attempts: maxAttempts,
    };
  }

  private recordTelemetry(result: VmixCommandResult) {
    demoStore.vmixTelemetry.unshift(result);
    demoStore.vmixTelemetry = demoStore.vmixTelemetry.slice(0, 50);
    void this.runtimeStateService.saveVmixTelemetry(result);
    return result;
  }
}
