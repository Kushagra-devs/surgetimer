'use client';

import { useEffect, useState } from 'react';
import type { HardwareCommissioningReport, HardwareParserTestResult, HardwareTelemetrySnapshot } from '@horse-timer/types';
import { apiGet, apiPost } from '../../lib/api';

type VerifyLinkResponse = {
  test: {
    ok: boolean;
    mode: string;
    source: string;
    connected: boolean;
    configuredForLiveTiming: boolean;
    parserRuleCount: number;
    at: string;
  };
  commissioning: HardwareCommissioningReport;
  telemetry: HardwareTelemetrySnapshot;
  at: string;
};

export function HardwareConnectionWizard() {
  const [report, setReport] = useState<HardwareCommissioningReport | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyLinkResponse | null>(null);
  const [parserPayload, setParserPayload] = useState('C0 TRIG 2026-03-27T12:00:00Z');
  const [parserResult, setParserResult] = useState<HardwareParserTestResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setReport(await apiGet<HardwareCommissioningReport>('/hardware/commissioning-checks'));
  }

  useEffect(() => {
    void load();
  }, []);

  async function verifyLink() {
    setLoading(true);
    try {
      const result = await apiPost<VerifyLinkResponse>('/hardware/verify-link', {});
      setVerifyResult(result);
      setReport(result.commissioning);
    } finally {
      setLoading(false);
    }
  }

  async function testParser() {
    setParserResult(
      await apiPost<HardwareParserTestResult>('/hardware/test-parser', {
        payload: parserPayload,
        source: 'serial',
      }),
    );
  }

  return (
    <div className="section-stack">
      <div className="metric-card">
        <div className="split-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <p className="eyebrow">Guided Hardware Connection</p>
            <p className="panel-title">Step-by-step hardware registration with live verification at each stage</p>
            <p className="muted" style={{ marginTop: 0 }}>
              Use this wizard in order. Do not move to the next step until the current step shows pass.
            </p>
          </div>
          <button className="action-button accent" onClick={() => void verifyLink()} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Current Connection'}
          </button>
        </div>
      </div>

      {report ? (
        <>
          <div className={`incident-strip ${report.overallStatus === 'pass' ? 'ok' : report.overallStatus === 'warn' ? 'warn' : 'critical'}`}>
            <strong>{report.overallStatus.toUpperCase()}</strong>
            <span>{report.summary}</span>
          </div>

          <div className="analysis-list">
            {report.checks.map((check, index) => (
              <div key={check.id} className={`analysis-item ${check.status === 'pass' ? 'ok' : check.status === 'warn' ? 'warn' : 'critical'}`}>
                <div className="analysis-title">
                  Step {index + 1} · {check.title}
                </div>
                <div className="analysis-copy">{check.detail}</div>
                <div className="compact-copy" style={{ marginTop: 8 }}>
                  What to do now: {check.action}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}

      <div className="section-grid admin-two-panel">
        <div className="metric-card">
          <p className="eyebrow">Quick Verification</p>
          <p className="panel-title">Live connection result</p>
          <div className="info-list">
            <div className="info-row"><span className="info-label">Last verification</span><span className="info-value">{verifyResult ? new Date(verifyResult.at).toLocaleString() : '--'}</span></div>
            <div className="info-row"><span className="info-label">Connection</span><span className="info-value">{verifyResult?.test.connected ? 'Open' : 'Closed'}</span></div>
            <div className="info-row"><span className="info-label">Configured for live</span><span className="info-value">{verifyResult?.test.configuredForLiveTiming ? 'Yes' : 'No'}</span></div>
            <div className="info-row"><span className="info-label">Parser rules</span><span className="info-value">{verifyResult?.test.parserRuleCount ?? '--'}</span></div>
          </div>
        </div>

        <div className="metric-card">
          <p className="eyebrow">Payload Verification</p>
          <p className="panel-title">Test a sample message</p>
          <div className="field-stack">
            <input className="field-input" value={parserPayload} onChange={(event) => setParserPayload(event.target.value)} />
            <button className="action-button" onClick={() => void testParser()}>
              Test Parser Against Sample
            </button>
          </div>
          {parserResult ? (
            <div className="warning-banner" style={{ marginTop: 14, color: '#142033', background: 'rgba(15, 124, 255, 0.08)' }}>
              {parserResult.ok
                ? `Parser matched ${parserResult.parsed?.type ?? '--'}${parserResult.parsed?.channel ? ` on ${parserResult.parsed.channel}` : ''}.`
                : 'Parser did not recognize the sample payload yet.'}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
