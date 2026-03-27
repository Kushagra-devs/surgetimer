'use client';

import { useState } from 'react';
import { apiGet, apiPost } from '../../lib/api';

export function BackupRecoveryConsole() {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState<'backup' | 'cache' | 'restart' | null>(null);

  async function downloadBackup() {
    setBusy('backup');
    setMessage('');
    try {
      const payload = await apiGet<Record<string, unknown>>('/system/backup-pack');
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `surgetimer-backup-pack-${Date.now()}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage('Backup pack generated and downloaded successfully.');
    } finally {
      setBusy(null);
    }
  }

  async function clearCache() {
    setBusy('cache');
    setMessage('');
    try {
      const response = await apiPost<{ message: string }>('/system/clear-cache', {});
      setMessage(response.message);
    } finally {
      setBusy(null);
    }
  }

  async function restartRuntime() {
    setBusy('restart');
    setMessage('');
    try {
      const response = await apiPost<{ message: string }>('/system/restart-runtime', {});
      setMessage(response.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="section-stack">
      <section className="metric-card">
        <p className="eyebrow">Backup and Recovery</p>
        <p className="panel-title">Export a full recovery pack and trigger safe runtime recovery actions</p>
        <div className="status-actions" style={{ marginTop: 16 }}>
          <button className="button-primary" onClick={() => void downloadBackup()} disabled={busy !== null}>
            {busy === 'backup' ? 'Generating Backup...' : 'Download Backup Pack'}
          </button>
          <button className="button-secondary" onClick={() => void clearCache()} disabled={busy !== null}>
            {busy === 'cache' ? 'Clearing Cache...' : 'Clear Runtime Cache'}
          </button>
          <button className="button-secondary" onClick={() => void restartRuntime()} disabled={busy !== null}>
            {busy === 'restart' ? 'Restarting...' : 'Restart Runtime'}
          </button>
        </div>
        {message ? <div className="inline-alert" style={{ marginTop: 14 }}>{message}</div> : null}
      </section>
    </div>
  );
}
