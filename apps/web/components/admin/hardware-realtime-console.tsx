'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import type { HardwareParserTestResult, HardwareTelemetrySnapshot } from '@horse-timer/types';
import { apiGet, apiPost } from '../../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export function HardwareRealtimeConsole() {
  const [telemetry, setTelemetry] = useState<HardwareTelemetrySnapshot | null>(null);
  const [parserPayload, setParserPayload] = useState('C0 TRIG 2026-03-27T12:00:00Z');
  const [parserSource, setParserSource] = useState<'serial' | 'usb-serial' | 'tcp'>('serial');
  const [parserResult, setParserResult] = useState<HardwareParserTestResult | null>(null);
  const [connectionResult, setConnectionResult] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const next = await apiGet<HardwareTelemetrySnapshot>('/hardware/telemetry');
      if (mounted) {
        setTelemetry(next);
      }
    }

    void load();
    const socket = io(API_BASE);
    socket.on('hardware.status.updated', (envelope) => {
      if (mounted && envelope?.payload) {
        setTelemetry(envelope.payload as HardwareTelemetrySnapshot);
      }
    });
    const interval = window.setInterval(() => {
      void load();
    }, 1200);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      socket.close();
    };
  }, []);

  async function runConnectionTest() {
    const result = await apiPost<Record<string, unknown>>('/hardware/test-connection');
    setConnectionResult(result);
    const next = await apiGet<HardwareTelemetrySnapshot>('/hardware/telemetry');
    setTelemetry(next);
  }

  async function runParserTest() {
    const result = await apiPost<HardwareParserTestResult>('/hardware/test-parser', {
      payload: parserPayload,
      source: parserSource,
    });
    setParserResult(result);
  }

  return (
    <div className="section-stack">
      <div className="metric-card">
        <div className="split-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <p className="eyebrow">Realtime Hardware Monitor</p>
            <p className="panel-title">Live connection state, raw signal history, parser output, and diagnostics</p>
          </div>
          <div className="realtime-badges">
            <span className={`health-badge ${telemetry?.status.connected ? 'ok' : 'warn'}`}>
              {telemetry?.status.connected ? 'Hardware Connected' : 'Hardware Disconnected'}
            </span>
            <span className="health-badge">{telemetry?.status.mode ?? '--'}</span>
            <span className="health-badge">{telemetry?.status.parserRuleCount ?? 0} parser rules</span>
          </div>
        </div>
        <div className="button-grid" style={{ marginTop: 18 }}>
          <button className="action-button" onClick={() => void apiPost('/hardware/connect').then(() => apiGet<HardwareTelemetrySnapshot>('/hardware/telemetry').then(setTelemetry))}>
            Connect
          </button>
          <button className="action-button" onClick={() => void apiPost('/hardware/disconnect').then(() => apiGet<HardwareTelemetrySnapshot>('/hardware/telemetry').then(setTelemetry))}>
            Disconnect
          </button>
          <button className="action-button accent" onClick={() => void runConnectionTest()}>
            Test Connection
          </button>
          <button className="action-button" onClick={() => void apiPost('/hardware/test-signal', { payload: 'TRIG', channel: 'C0' }).then(() => apiGet<HardwareTelemetrySnapshot>('/hardware/telemetry').then(setTelemetry))}>
            Inject Test Signal
          </button>
        </div>
      </div>

      <div className="dashboard-realtime-grid">
        <div className="health-card">
          <p className="eyebrow">Connection Status</p>
          <div className="info-list">
            <div className="info-row"><span className="info-label">Connected</span><span className="info-value">{telemetry?.status.connected ? 'Yes' : 'No'}</span></div>
            <div className="info-row"><span className="info-label">Mode</span><span className="info-value">{telemetry?.status.mode ?? '--'}</span></div>
            <div className="info-row"><span className="info-label">Last message at</span><span className="info-value">{telemetry?.status.lastMessageAt ? new Date(telemetry.status.lastMessageAt).toLocaleString() : '--'}</span></div>
            <div className="info-row"><span className="info-label">Disconnect count</span><span className="info-value">{telemetry?.counters.disconnects ?? 0}</span></div>
          </div>
          {connectionResult ? (
            <div className="warning-banner" style={{ marginTop: 14, color: '#142033', background: 'rgba(15, 124, 255, 0.08)' }}>
              Connection test: {String(connectionResult.ok ? 'passed' : 'failed')} at {String(connectionResult.at ?? '--')}
            </div>
          ) : null}
        </div>

        <div className="health-card">
          <p className="eyebrow">Counters</p>
          <div className="info-list">
            <div className="info-row"><span className="info-label">Raw messages</span><span className="info-value">{telemetry?.counters.rawMessages ?? 0}</span></div>
            <div className="info-row"><span className="info-label">Diagnostics</span><span className="info-value">{telemetry?.counters.diagnostics ?? 0}</span></div>
            <div className="info-row"><span className="info-label">Duplicates</span><span className="info-value">{telemetry?.counters.duplicates ?? 0}</span></div>
            <div className="info-row"><span className="info-label">Last update</span><span className="info-value">{telemetry?.lastUpdatedAt ? new Date(telemetry.lastUpdatedAt).toLocaleTimeString() : '--'}</span></div>
          </div>
        </div>

        <div className="health-card">
          <p className="eyebrow">Last Signal</p>
          <div className="info-list">
            <div className="info-row"><span className="info-label">Payload</span><span className="info-value">{telemetry?.lastMessage?.payload ?? '--'}</span></div>
            <div className="info-row"><span className="info-label">Parsed type</span><span className="info-value">{telemetry?.lastMessage?.parsed?.type ?? '--'}</span></div>
            <div className="info-row"><span className="info-label">Channel</span><span className="info-value">{telemetry?.lastMessage?.parsed?.channel ?? '--'}</span></div>
            <div className="info-row"><span className="info-label">Source</span><span className="info-value">{telemetry?.lastMessage?.source ?? '--'}</span></div>
          </div>
        </div>
      </div>

      <div className="metric-card">
        <p className="eyebrow">Parser Testing</p>
        <p className="panel-title">Validate sample ALGE payloads before live deployment</p>
        <div className="button-grid" style={{ gridTemplateColumns: '2fr 1fr auto', marginTop: 14 }}>
          <input className="field-input" value={parserPayload} onChange={(event) => setParserPayload(event.target.value)} />
          <select className="field-input" value={parserSource} onChange={(event) => setParserSource(event.target.value as 'serial' | 'usb-serial' | 'tcp')}>
            <option value="serial">serial</option>
            <option value="usb-serial">usb-serial</option>
            <option value="tcp">tcp</option>
          </select>
          <button className="action-button accent" onClick={() => void runParserTest()}>
            Test Parser
          </button>
        </div>
        {parserResult ? (
          <div className="table-shell" style={{ marginTop: 16 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Payload</th>
                  <th>Result</th>
                  <th>Parsed Type</th>
                  <th>Channel</th>
                  <th>At</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{parserResult.payload}</td>
                  <td>{parserResult.ok ? 'Matched' : 'Unknown'}</td>
                  <td>{parserResult.parsed?.type ?? '--'}</td>
                  <td>{parserResult.parsed?.channel ?? '--'}</td>
                  <td>{new Date(parserResult.at).toLocaleTimeString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <div className="dashboard-realtime-grid">
        <div className="metric-card surface-soft">
          <p className="eyebrow">Diagnostics History</p>
          <div className="analysis-list">
            {(telemetry?.diagnostics ?? []).slice(0, 12).map((item) => (
              <div key={item.id} className={`analysis-item ${item.level === 'error' ? 'critical' : item.level === 'warn' ? 'warn' : 'ok'}`}>
                <div className="analysis-title">{item.level.toUpperCase()}</div>
                <div className="analysis-copy">{item.message}</div>
                <div className="compact-copy" style={{ marginTop: 6 }}>{new Date(item.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="metric-card surface-soft" style={{ gridColumn: 'span 2' }}>
          <p className="eyebrow">Raw Hardware History</p>
          <div className="table-shell">
            <table className="table">
              <thead>
                <tr>
                  <th>Received</th>
                  <th>Source</th>
                  <th>Port</th>
                  <th>Payload</th>
                  <th>Parsed</th>
                  <th>Channel</th>
                </tr>
              </thead>
              <tbody>
                {(telemetry?.logs ?? []).slice(0, 40).map((item, index) => (
                  <tr key={`${item.receivedAt}-${index}`}>
                    <td>{new Date(item.receivedAt).toLocaleString()}</td>
                    <td>{item.source}</td>
                    <td>{item.port}</td>
                    <td>{item.payload}</td>
                    <td>{item.parsed?.type ?? '--'}</td>
                    <td>{item.parsed?.channel ?? '--'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
