'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '../../lib/api';

type SerialDiscoveryResponse = {
  ok: boolean;
  ports: Array<{
    path: string;
    manufacturer: string;
    serialNumber: string;
    vendorId: string;
    productId: string;
    friendlyName: string;
  }>;
  reason?: string;
};

export function HardwareDiscoveryConsole() {
  const [data, setData] = useState<SerialDiscoveryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const next = await apiGet<SerialDiscoveryResponse>('/hardware/serial-ports');
      setData(next);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="section-stack">
      <section className="metric-card">
        <div className="split-row" style={{ alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <p className="eyebrow">Hardware Discovery</p>
            <p className="panel-title">Detect serial devices and identify the likely ALGE timing master port</p>
          </div>
          <button className="button-secondary" onClick={() => void load()} disabled={loading}>
            {loading ? 'Scanning...' : 'Refresh Port List'}
          </button>
        </div>
        <div className="report-table" style={{ marginTop: 16 }}>
          <div className="report-row report-head">
            <span>Port</span>
            <span>Manufacturer</span>
            <span>VID/PID</span>
            <span>Serial</span>
          </div>
          {(data?.ports ?? []).map((port) => (
            <div key={port.path} className="report-row">
              <span>{port.path}</span>
              <span>{port.manufacturer || '--'}</span>
              <span>{port.vendorId || '--'} / {port.productId || '--'}</span>
              <span>{port.serialNumber || '--'}</span>
            </div>
          ))}
        </div>
        {!loading && !(data?.ports.length) ? (
          <div className="inline-alert" style={{ marginTop: 14 }}>
            {data?.reason ?? 'No serial devices were detected from the current runtime.'}
          </div>
        ) : null}
      </section>
    </div>
  );
}
