'use client';

import { useEffect, useState } from 'react';
import type { AppSettings, EventReadinessPolicy } from '@horse-timer/types';
import { apiGet, apiPost } from '../../lib/api';

export function EventReadinessConsole() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [savedAt, setSavedAt] = useState('');

  useEffect(() => {
    void apiGet<AppSettings>('/settings/app').then(setSettings);
  }, []);

  async function save() {
    if (!settings) {
      return;
    }
    const updated = await apiPost<AppSettings>('/settings/app', settings);
    setSettings(updated);
    setSavedAt(new Date().toLocaleTimeString());
  }

  function patch(patch: Partial<EventReadinessPolicy>) {
    if (!settings) {
      return;
    }
    setSettings({
      ...settings,
      readinessPolicy: {
        ...settings.readinessPolicy,
        ...patch,
      },
    });
  }

  if (!settings) {
    return <div className="metric-card">Loading event readiness policy...</div>;
  }

  return (
    <div className="metric-card">
      <p className="eyebrow">Event Readiness Policy</p>
      <p className="panel-title">Go-live guardrails, operational thresholds, and fallback rules</p>
      <div className="form-grid">
        <ToggleRow label="Require physical ALGE hardware" value={settings.readinessPolicy.requirePhysicalHardware} onToggle={() => patch({ requirePhysicalHardware: !settings.readinessPolicy.requirePhysicalHardware })} />
        <ToggleRow label="Require Postgres and Redis" value={settings.readinessPolicy.requirePersistenceForGoLive} onToggle={() => patch({ requirePersistenceForGoLive: !settings.readinessPolicy.requirePersistenceForGoLive })} />
        <ToggleRow label="Require ready competitors" value={settings.readinessPolicy.requireQueueReadyCompetitor} onToggle={() => patch({ requireQueueReadyCompetitor: !settings.readinessPolicy.requireQueueReadyCompetitor })} />
        <ToggleRow label="Require parser rules" value={settings.readinessPolicy.requireParserRules} onToggle={() => patch({ requireParserRules: !settings.readinessPolicy.requireParserRules })} />
        <ToggleRow label="Require spectator validation" value={settings.readinessPolicy.requireSpectatorLinkValidation} onToggle={() => patch({ requireSpectatorLinkValidation: !settings.readinessPolicy.requireSpectatorLinkValidation })} />
        <ToggleRow label="Require vMix on broadcast arena" value={settings.readinessPolicy.requireVmixIfBroadcastArena} onToggle={() => patch({ requireVmixIfBroadcastArena: !settings.readinessPolicy.requireVmixIfBroadcastArena })} />
        <ToggleRow label="Allow manual judge fallback" value={settings.readinessPolicy.allowManualFallbackStart} onToggle={() => patch({ allowManualFallbackStart: !settings.readinessPolicy.allowManualFallbackStart })} />
        <ToggleRow label="Freeze configuration during live round" value={settings.readinessPolicy.freezeConfigurationDuringLiveRound} onToggle={() => patch({ freezeConfigurationDuringLiveRound: !settings.readinessPolicy.freezeConfigurationDuringLiveRound })} />
        <label className="field-stack">
          <span className="info-label">Minimum ready competitors</span>
          <input
            type="number"
            value={settings.readinessPolicy.minimumReadyCompetitors}
            onChange={(event) => patch({ minimumReadyCompetitors: Number(event.target.value) })}
            className="field-input"
          />
        </label>
      </div>
      <div className="split-row" style={{ marginTop: 18, flexWrap: 'wrap' }}>
        <div className="muted">Last saved {savedAt || 'not yet in this session'}</div>
        <button className="action-button accent" onClick={() => void save()}>
          Save Readiness Policy
        </button>
      </div>
    </div>
  );
}

function ToggleRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: () => void }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <button className="action-button" onClick={onToggle}>
        {value ? 'Required' : 'Optional'}
      </button>
    </div>
  );
}
