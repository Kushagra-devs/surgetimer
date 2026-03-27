'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type {
  HardwareDiagnosticEntry,
  HardwareParserRule,
  HardwareStatus,
  IntegrationSettings,
  VmixCommandResult,
} from '@horse-timer/types';
import { apiGet, apiPost } from '../../lib/api';

const blankRule: HardwareParserRule = {
  id: '',
  enabled: true,
  type: 'TRIGGER',
  pattern: '',
  channelGroupName: 'channel',
  timestampGroupName: 'timestamp',
  sourceFilter: 'any',
};

export function IntegrationConsole() {
  const [settings, setSettings] = useState<IntegrationSettings | null>(null);
  const [hardwareStatus, setHardwareStatus] = useState<HardwareStatus | null>(null);
  const [hardwareDiagnostics, setHardwareDiagnostics] = useState<HardwareDiagnosticEntry[]>([]);
  const [vmixStatus, setVmixStatus] = useState<Record<string, unknown> | null>(null);
  const [vmixPackage, setVmixPackage] = useState<Record<string, unknown> | null>(null);
  const [vmixHealth, setVmixHealth] = useState<Record<string, unknown> | null>(null);
  const [vmixTestSuite, setVmixTestSuite] = useState<Record<string, unknown> | null>(null);
  const [vmixResult, setVmixResult] = useState<VmixCommandResult | null>(null);
  const [newRule, setNewRule] = useState<HardwareParserRule>(blankRule);
  const [customTrigger, setCustomTrigger] = useState('LIVE 00.00');

  async function load() {
    const [integrationData, hardwareData, diagnosticsData, vmixData, vmixPackageData, vmixHealthData] = await Promise.all([
      apiGet<IntegrationSettings>('/settings/integrations'),
      apiGet<HardwareStatus>('/hardware/status'),
      apiGet<HardwareDiagnosticEntry[]>('/hardware/diagnostics'),
      apiGet<Record<string, unknown>>('/vmix/status'),
      apiGet<Record<string, unknown>>('/vmix/package'),
      apiGet<Record<string, unknown>>('/vmix/health'),
    ]);
    setSettings(integrationData);
    setHardwareStatus(hardwareData);
    setHardwareDiagnostics(diagnosticsData);
    setVmixStatus(vmixData);
    setVmixPackage(vmixPackageData);
    setVmixHealth(vmixHealthData);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save() {
    if (!settings) {
      return;
    }
    const updated = await apiPost<IntegrationSettings>('/settings/integrations', settings);
    setSettings(updated);
    await apiPost('/hardware/reconfigure');
    await load();
  }

  async function testVmix() {
    const result = await apiPost<VmixCommandResult>('/vmix/trigger', { value: customTrigger });
    setVmixResult(result);
    await load();
  }

  async function runVmixTestSuite() {
    const result = await apiPost<Record<string, unknown>>('/vmix/test-suite', {});
    setVmixTestSuite(result);
    await load();
  }

  function addRule() {
    if (!settings || !newRule.id || !newRule.pattern) {
      return;
    }
    setSettings({
      ...settings,
      hardware: {
        ...settings.hardware,
        parserRules: [...settings.hardware.parserRules, newRule],
      },
    });
    setNewRule(blankRule);
  }

  function removeRule(id: string) {
    if (!settings) {
      return;
    }
    setSettings({
      ...settings,
      hardware: {
        ...settings.hardware,
        parserRules: settings.hardware.parserRules.filter((rule) => rule.id !== id),
      },
    });
  }

  function updateRule(id: string, patch: Partial<HardwareParserRule>) {
    if (!settings) {
      return;
    }
    setSettings({
      ...settings,
      hardware: {
        ...settings.hardware,
        parserRules: settings.hardware.parserRules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)),
      },
    });
  }

  if (!settings) {
    return <div className="metric-card">Loading integration console...</div>;
  }

  return (
    <div className="section-stack">
      <div className="metric-card">
        <p className="eyebrow">Integration Control Center</p>
        <p className="panel-title">Production configuration for ALGE hardware, parser rules, diagnostics, Redis/Postgres-backed settings, and vMix automation</p>
        <div className="button-grid">
          <button className="action-button accent" onClick={() => void save()}>
            Save Integration Settings
          </button>
          <button className="action-button" onClick={() => void apiPost('/hardware/connect').then(load)}>
            Connect Hardware
          </button>
          <button className="action-button" onClick={() => void apiPost('/hardware/disconnect').then(load)}>
            Disconnect Hardware
          </button>
          <button className="action-button" onClick={() => void apiPost('/hardware/test-signal', { payload: 'TRIG', channel: 'C0' }).then(load)}>
            Inject Mock Signal
          </button>
        </div>
      </div>

      <div className="section-grid admin-two-panel">
        <div className="metric-card">
          <p className="eyebrow">ALGE Hardware</p>
          <p className="panel-title">Adapter and transport settings</p>
          <div className="form-grid">
            <label className="field-stack">
              <span className="info-label">Adapter mode</span>
              <select
                value={settings.hardware.adapterMode}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    hardware: { ...settings.hardware, adapterMode: event.target.value as IntegrationSettings['hardware']['adapterMode'] },
                  })
                }
                style={inputStyle}
              >
                <option value="mock">Mock</option>
                <option value="serial">Serial / USB Serial</option>
                <option value="tcp">TCP Bridge</option>
              </select>
            </label>
            <label className="field-stack">
              <span className="info-label">Auto-connect on boot</span>
              <select
                value={settings.hardware.autoConnectOnBoot ? 'YES' : 'NO'}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    hardware: { ...settings.hardware, autoConnectOnBoot: event.target.value === 'YES' },
                  })
                }
                style={inputStyle}
              >
                <option value="YES">Yes</option>
                <option value="NO">No</option>
              </select>
            </label>
            <label className="field-stack">
              <span className="info-label">Serial port</span>
              <input
                value={settings.hardware.serialPort}
                onChange={(event) => setSettings({ ...settings, hardware: { ...settings.hardware, serialPort: event.target.value } })}
                style={inputStyle}
              />
            </label>
            <label className="field-stack">
              <span className="info-label">TCP host</span>
              <input
                value={settings.hardware.tcpHost}
                onChange={(event) => setSettings({ ...settings, hardware: { ...settings.hardware, tcpHost: event.target.value } })}
                style={inputStyle}
              />
            </label>
            <label className="field-stack">
              <span className="info-label">TCP port</span>
              <input
                type="number"
                value={settings.hardware.tcpPort}
                onChange={(event) => setSettings({ ...settings, hardware: { ...settings.hardware, tcpPort: Number(event.target.value) } })}
                style={inputStyle}
              />
            </label>
            <label className="field-stack">
              <span className="info-label">Line delimiter</span>
              <select
                value={settings.hardware.lineDelimiter}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    hardware: { ...settings.hardware, lineDelimiter: event.target.value as IntegrationSettings['hardware']['lineDelimiter'] },
                  })
                }
                style={inputStyle}
              >
                <option value="LF">LF</option>
                <option value="CRLF">CRLF</option>
                <option value="CR">CR</option>
              </select>
            </label>
          </div>
          <div className="info-list" style={{ marginTop: 18 }}>
            <div className="info-row">
              <span className="info-label">Connection</span>
              <span className="info-value">
                {hardwareStatus?.connected
                  ? hardwareStatus.source === 'physical'
                    ? 'ALGE connected'
                    : 'Simulator connected'
                  : hardwareStatus?.source === 'physical'
                    ? 'ALGE disconnected'
                    : 'Simulator disconnected'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Mode</span>
              <span className="info-value">{hardwareStatus ? `${hardwareStatus.source} · ${hardwareStatus.mode}` : '--'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Parser rules</span>
              <span className="info-value">{settings.hardware.parserRules.length}</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <p className="eyebrow">vMix Automation</p>
          <p className="panel-title">Live HTTP execution and control routing</p>
          <div className="form-grid">
            <label className="field-stack">
              <span className="info-label">Enabled</span>
              <select
                value={settings.vmix.enabled ? 'YES' : 'NO'}
                onChange={(event) => setSettings({ ...settings, vmix: { ...settings.vmix, enabled: event.target.value === 'YES' } })}
                style={inputStyle}
              >
                <option value="YES">Yes</option>
                <option value="NO">No</option>
              </select>
            </label>
            <label className="field-stack">
              <span className="info-label">Base URL</span>
              <input
                value={settings.vmix.baseUrl}
                onChange={(event) => setSettings({ ...settings, vmix: { ...settings.vmix, baseUrl: event.target.value } })}
                style={inputStyle}
              />
            </label>
            <label className="field-stack">
              <span className="info-label">Input name</span>
              <input
                value={settings.vmix.inputName}
                onChange={(event) => setSettings({ ...settings, vmix: { ...settings.vmix, inputName: event.target.value } })}
                style={inputStyle}
              />
            </label>
            <label className="field-stack">
              <span className="info-label">Title field</span>
              <input
                value={settings.vmix.titleField}
                onChange={(event) => setSettings({ ...settings, vmix: { ...settings.vmix, titleField: event.target.value } })}
                style={inputStyle}
              />
            </label>
            <label className="field-stack">
              <span className="info-label">Trigger preset</span>
              <select
                value={settings.vmix.triggerPreset}
                onChange={(event) =>
                  setSettings({ ...settings, vmix: { ...settings.vmix, triggerPreset: event.target.value as IntegrationSettings['vmix']['triggerPreset'] } })
                }
                style={inputStyle}
              >
                <option value="NONE">None</option>
                <option value="PLAY_INPUT">Play Input</option>
                <option value="CUT_INPUT">Cut Input</option>
                <option value="FADE_INPUT">Fade Input</option>
                <option value="SET_TEXT">Set Text</option>
                <option value="TRIGGER_SHORTCUT">Trigger Shortcut</option>
              </select>
            </label>
            <label className="field-stack">
              <span className="info-label">Auto trigger on state change</span>
              <select
                value={settings.vmix.autoTriggerOnStateChange ? 'YES' : 'NO'}
                onChange={(event) =>
                  setSettings({ ...settings, vmix: { ...settings.vmix, autoTriggerOnStateChange: event.target.value === 'YES' } })
                }
                style={inputStyle}
              >
                <option value="YES">Yes</option>
                <option value="NO">No</option>
              </select>
            </label>
          </div>
          <div className="button-grid" style={{ marginTop: 18 }}>
            <input value={customTrigger} onChange={(event) => setCustomTrigger(event.target.value)} style={inputStyle} />
            <button className="action-button" onClick={() => void testVmix()}>
              Test vMix Trigger
            </button>
            <button className="action-button accent" onClick={() => void runVmixTestSuite()}>
              Run vMix Test Suite
            </button>
          </div>
          {vmixResult ? (
            <div className="warning-banner" style={{ marginTop: 16, color: vmixResult.ok ? '#d8ffee' : '#ffd8cb' }}>
              {vmixResult.ok ? 'vMix command executed/generated.' : `vMix error: ${vmixResult.reason}`}
            </div>
          ) : null}
        </div>
      </div>

      <div className="section-grid admin-two-panel">
        <div className="metric-card">
          <p className="eyebrow">vMix Broadcast Package</p>
          <p className="panel-title">Primary URLs, failover URLs, and title/data workflow</p>
          <div className="info-list">
            <div className="info-row"><span className="info-label">Primary browser input</span><span className="info-value spectator-link">{String((vmixPackage?.primary as Record<string, unknown> | undefined)?.url ?? '--')}</span></div>
            <div className="info-row"><span className="info-label">Browser backup</span><span className="info-value spectator-link">{String((vmixPackage?.failover as Record<string, unknown> | undefined)?.browserBackupUrl ?? '--')}</span></div>
            <div className="info-row"><span className="info-label">Widget capture</span><span className="info-value spectator-link">{String((vmixPackage?.failover as Record<string, unknown> | undefined)?.widgetCaptureUrl ?? '--')}</span></div>
            <div className="info-row"><span className="info-label">JSON data source</span><span className="info-value spectator-link">{String((vmixPackage?.failover as Record<string, unknown> | undefined)?.dataSourceJsonUrl ?? '--')}</span></div>
            <div className="info-row"><span className="info-label">CSV data source</span><span className="info-value spectator-link">{String((vmixPackage?.failover as Record<string, unknown> | undefined)?.dataSourceCsvUrl ?? '--')}</span></div>
          </div>
        </div>

        <div className="metric-card">
          <p className="eyebrow">vMix Health</p>
          <p className="panel-title">Broadcast readiness and failover posture</p>
          <div className="info-list">
            <div className="info-row"><span className="info-label">Primary mode</span><span className="info-value">{String(vmixHealth?.primaryMode ?? '--')}</span></div>
            <div className="info-row"><span className="info-label">Health score</span><span className="info-value">{vmixHealth?.score !== undefined ? `${String(vmixHealth.score)}%` : '--'}</span></div>
            <div className="info-row"><span className="info-label">Browser ready</span><span className="info-value">{String(vmixHealth?.browserReady ?? '--')}</span></div>
            <div className="info-row"><span className="info-label">Data source ready</span><span className="info-value">{String(vmixHealth?.dataSourceReady ?? '--')}</span></div>
            <div className="info-row"><span className="info-label">API automation</span><span className="info-value">{String(vmixHealth?.apiEnabled ?? '--')}</span></div>
            <div className="info-row"><span className="info-label">Fallback</span><span className="info-value">{String(vmixHealth?.recommendedFallback ?? '--')}</span></div>
          </div>
        </div>
      </div>

      {vmixTestSuite ? (
        <div className="metric-card">
          <p className="eyebrow">vMix Test Suite</p>
          <p className="panel-title">Operator-side verification of browser, data, trigger, and failover paths</p>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#10213a' }}>{JSON.stringify(vmixTestSuite, null, 2)}</pre>
        </div>
      ) : null}

      <div className="metric-card">
        <p className="eyebrow">Parser Rules</p>
        <p className="panel-title">Configurable ALGE payload parsing</p>
        <div className="widget-grid">
          {settings.hardware.parserRules.map((rule) => (
            <div key={rule.id} className="widget-card">
              <div className="form-grid">
                <label className="field-stack">
                  <span className="info-label">Rule id</span>
                  <input value={rule.id} onChange={(event) => updateRule(rule.id, { id: event.target.value })} style={inputStyle} />
                </label>
                <label className="field-stack">
                  <span className="info-label">Type</span>
                  <select value={rule.type} onChange={(event) => updateRule(rule.id, { type: event.target.value as HardwareParserRule['type'] })} style={inputStyle}>
                    <option value="TRIGGER">Trigger</option>
                    <option value="FINISH">Finish</option>
                  </select>
                </label>
                <label className="field-stack span-2">
                  <span className="info-label">Regex pattern</span>
                  <input value={rule.pattern} onChange={(event) => updateRule(rule.id, { pattern: event.target.value })} style={inputStyle} />
                </label>
                <label className="field-stack">
                  <span className="info-label">Source filter</span>
                  <select value={rule.sourceFilter ?? 'any'} onChange={(event) => updateRule(rule.id, { sourceFilter: event.target.value as HardwareParserRule['sourceFilter'] })} style={inputStyle}>
                    <option value="any">Any</option>
                    <option value="serial">Serial</option>
                    <option value="usb-serial">USB Serial</option>
                    <option value="tcp">TCP</option>
                  </select>
                </label>
                <label className="field-stack">
                  <span className="info-label">Enabled</span>
                  <select value={rule.enabled ? 'YES' : 'NO'} onChange={(event) => updateRule(rule.id, { enabled: event.target.value === 'YES' })} style={inputStyle}>
                    <option value="YES">Yes</option>
                    <option value="NO">No</option>
                  </select>
                </label>
              </div>
              <div className="button-grid" style={{ marginTop: 14 }}>
                <button className="action-button danger" onClick={() => removeRule(rule.id)}>
                  Remove Rule
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="metric-card surface-soft" style={{ marginTop: 16 }}>
          <p className="eyebrow">Add Rule</p>
          <div className="form-grid">
            <input placeholder="rule-id" value={newRule.id} onChange={(event) => setNewRule({ ...newRule, id: event.target.value })} style={inputStyle} />
            <select value={newRule.type} onChange={(event) => setNewRule({ ...newRule, type: event.target.value as HardwareParserRule['type'] })} style={inputStyle}>
              <option value="TRIGGER">Trigger</option>
              <option value="FINISH">Finish</option>
            </select>
            <input className="span-2" placeholder="Regex pattern" value={newRule.pattern} onChange={(event) => setNewRule({ ...newRule, pattern: event.target.value })} style={inputStyle} />
          </div>
          <div style={{ marginTop: 14 }}>
            <button className="action-button accent" onClick={addRule}>
              Add Parser Rule
            </button>
          </div>
        </div>
      </div>

      <div className="section-grid admin-two-panel">
        <div className="metric-card">
          <p className="eyebrow">Hardware Diagnostics</p>
          <p className="panel-title">Recent ALGE and adapter events</p>
          <div className="table-shell">
            <table className="table">
              <thead>
                <tr>
                  <th>Level</th>
                  <th>Message</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {hardwareDiagnostics.slice(0, 10).map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.level}</td>
                    <td>{entry.message}</td>
                    <td>{new Date(entry.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="metric-card">
          <p className="eyebrow">vMix Telemetry</p>
          <p className="panel-title">Latest command status</p>
          <pre className="code-panel">{JSON.stringify(vmixStatus, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 16,
  border: '1px solid rgba(15, 23, 42, 0.09)',
  background: '#ffffff',
  color: '#142033',
} satisfies CSSProperties;
