'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { apiGet, apiPost } from '../../lib/api';
import { DEFAULT_PUBLIC_WEB_BASE_URL } from '../../lib/runtime-config';
import type { PublicLiveFeed } from '@horse-timer/types';

const DEFAULT_SHARE_URL = `${DEFAULT_PUBLIC_WEB_BASE_URL}/live`;

function sanitizePublicUrl(value?: string | null) {
  if (!value) {
    return DEFAULT_PUBLIC_WEB_BASE_URL;
  }

  if (
    value.includes('localhost')
    || value.includes('127.0.0.1')
    || value.includes('192.168.')
    || value.includes('surgetimer.local')
  ) {
    return DEFAULT_PUBLIC_WEB_BASE_URL;
  }

  return value.replace(/\/$/, '');
}

export function LiveShareConsole() {
  const [feed, setFeed] = useState<PublicLiveFeed | null>(null);
  const [copied, setCopied] = useState(false);
  const [controlCopied, setControlCopied] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [mobileCode, setMobileCode] = useState<string | null>(null);
  const [mobileCodeExpiresAt, setMobileCodeExpiresAt] = useState<string | null>(null);
  const [mobileMessage, setMobileMessage] = useState('');
  const [mobileBusy, setMobileBusy] = useState(false);
  const spectatorQrRef = useRef<HTMLDivElement | null>(null);
  const controlQrRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const result = await apiGet<PublicLiveFeed>('/overlay/public-feed');
      if (mounted) {
        setFeed(result);
      }
    }

    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 2500);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const publicBaseUrl = sanitizePublicUrl(feed?.spectator?.publicBaseUrl);
  const shareQuery = feed?.spectator.requireToken ? `?token=${encodeURIComponent(feed?.spectator.shareToken ?? '')}` : '';
  const shareUrl = feed?.eventId && feed?.classId
    ? `${publicBaseUrl}/live/${feed.eventId}/${feed.classId}${shareQuery}`
    : feed?.shareUrl
      ? sanitizePublicUrl(feed.shareUrl).replace(/\/live$/, '/live')
      : DEFAULT_SHARE_URL;
  const mobileControlBaseUrl = `${publicBaseUrl}/mobile-control`;
  const mobileControlUrl = mobileCode ? `${mobileControlBaseUrl}?code=${encodeURIComponent(mobileCode)}` : mobileControlBaseUrl;
  const currentSummary = useMemo(() => {
    const overlay = feed?.overlay;
    if (!overlay) {
      return 'Waiting for live timing feed';
    }
    return `${overlay.riderName} • ${overlay.horseName} • ${overlay.className}`;
  }, [feed]);

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function copyControlLink() {
    await navigator.clipboard.writeText(mobileControlUrl);
    setControlCopied(true);
    window.setTimeout(() => setControlCopied(false), 1600);
  }

  function downloadQr(ref: React.RefObject<HTMLDivElement | null>, fileName: string) {
    const svg = ref.current?.querySelector('svg');
    if (!svg) {
      return;
    }

    const serialized = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function generateMobileCode() {
    setMobileBusy(true);
    setMobileMessage('');
    try {
      const response = await apiPost<{ code: string; expiresAt: string }>('/mobile-access/generate', {
        masterPassword,
      });
      setMobileCode(response.code);
      setMobileCodeExpiresAt(response.expiresAt);
      setMobileMessage('New mobile control code generated. Only this latest code will open the mobile timer page.');
    } catch (error) {
      setMobileMessage(error instanceof Error ? error.message : 'Unable to generate mobile access code.');
    } finally {
      setMobileBusy(false);
    }
  }

  return (
    <div className="metric-card">
      <div className="split-row" style={{ alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 420px', minWidth: 0 }}>
          <p className="eyebrow">Public Share</p>
          <p className="panel-title">Spectator QR for live timer, scorecard, and run history</p>
          <p className="muted" style={{ marginTop: 8 }}>
            Scan this QR on any phone connected to the same network to open the public live scorecard page with the current timer, active competitor, and completed run history.
          </p>
          <div className="info-list" style={{ marginTop: 18 }}>
            <div className="info-row">
              <span className="info-label">Event / Class</span>
              <span className="info-value">{feed?.eventName ?? '--'} / {feed?.className ?? '--'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Public URL</span>
              <span className="info-value spectator-link">{shareUrl}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Current live item</span>
              <span className="info-value">{currentSummary}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Token</span>
              <span className="info-value">{feed?.spectator.requireToken ? 'Protected link active' : 'Open link'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Last update</span>
              <span className="info-value">{feed ? new Date(feed.updatedAt).toLocaleString() : '--'}</span>
            </div>
          </div>
          <div className="button-grid" style={{ marginTop: 18 }}>
            <button className="action-button accent" onClick={() => void copyLink()}>
              {copied ? 'Link Copied' : 'Copy Public Link'}
            </button>
            <button className="action-button" onClick={() => void copyControlLink()}>
              {controlCopied ? 'Control Link Copied' : 'Copy Mobile Control Link'}
            </button>
            <a className="action-button" href="/live" target="_blank" rel="noreferrer">
              Open Spectator View
            </a>
            <a className="action-button" href="/mobile-control" target="_blank" rel="noreferrer">
              Open Mobile Control
            </a>
          </div>
          <div className="metric-card surface-soft" style={{ marginTop: 18 }}>
            <p className="eyebrow">Protected Mobile Control</p>
            <p className="panel-title">Unlock with master password and generate a rotating access code</p>
            <div className="section-grid" style={{ marginTop: 12 }}>
              <label className="field-stack">
                <span className="info-label">Master Password</span>
                <input
                  className="field-input"
                  type="password"
                  placeholder="Enter master password"
                  value={masterPassword}
                  onChange={(event) => setMasterPassword(event.target.value)}
                />
              </label>
              <div className="field-stack">
                <span className="info-label">Current Mobile Code</span>
                <div className="field-input" style={{ display: 'flex', alignItems: 'center' }}>
                  {mobileCode ?? 'Generate a new code'}
                </div>
              </div>
            </div>
            <div className="status-actions" style={{ marginTop: 12 }}>
              <button className="button-primary" onClick={() => void generateMobileCode()} disabled={mobileBusy}>
                {mobileBusy ? 'Generating...' : 'Generate New Mobile Code'}
              </button>
              <button className="button-secondary" onClick={() => void copyControlLink()} disabled={!mobileCode}>
                {controlCopied ? 'Control Link Copied' : 'Copy Protected Mobile Link'}
              </button>
            </div>
            <div className="info-list" style={{ marginTop: 12 }}>
              <div className="info-row">
                <span className="info-label">Protected URL</span>
                <span className="info-value spectator-link">{mobileControlUrl}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Expires</span>
                <span className="info-value">{mobileCodeExpiresAt ? new Date(mobileCodeExpiresAt).toLocaleString() : '--'}</span>
              </div>
            </div>
            {mobileMessage ? <div className="inline-alert" style={{ marginTop: 12 }}>{mobileMessage}</div> : null}
          </div>
        </div>
        <div className="share-qr-grid">
          <div className="qr-card">
            <div className="qr-shell" ref={spectatorQrRef}>
              <QRCode value={shareUrl} size={180} bgColor="#ffffff" fgColor="#0f172a" />
            </div>
            <p className="qr-caption">Scan for spectator scoreboard.</p>
            <button className="action-button" onClick={() => downloadQr(spectatorQrRef, 'surgetimer-spectator-qr.svg')}>
              Download Spectator QR
            </button>
          </div>
          <div className="qr-card">
            <div className="qr-shell" ref={controlQrRef}>
              <QRCode value={mobileControlUrl} size={180} bgColor="#ffffff" fgColor="#0f172a" />
            </div>
            <p className="qr-caption">Scan for protected mobile timer control on the same LAN.</p>
            <button className="action-button" onClick={() => downloadQr(controlQrRef, 'surgetimer-mobile-control-qr.svg')}>
              Download Control QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
