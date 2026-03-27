'use client';

import { useEffect, useState } from 'react';

type SavedDevice = {
  id: string;
  name: string;
  addedAt: string;
};

type BluetoothNavigator = Navigator & {
  bluetooth?: {
    requestDevice(options: {
      acceptAllDevices: boolean;
      optionalServices?: string[];
    }): Promise<{
      id: string;
      name?: string;
    }>;
  };
};

const STORAGE_KEY = 'surgetimer-bluetooth-devices';

export function BluetoothDeviceConsole() {
  const [supported, setSupported] = useState(false);
  const [devices, setDevices] = useState<SavedDevice[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSupported(typeof navigator !== 'undefined' && 'bluetooth' in navigator);
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setDevices(JSON.parse(raw) as SavedDevice[]);
      }
    } catch {
      setDevices([]);
    }
  }, []);

  function persist(next: SavedDevice[]) {
    setDevices(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  async function pairDevice() {
    const bluetoothNavigator = navigator as BluetoothNavigator;

    if (!bluetoothNavigator.bluetooth) {
      setMessage('Web Bluetooth is not supported in this browser. Use Wi-Fi QR mobile control instead.');
      return;
    }

    setBusy(true);
    setMessage('');

    try {
      const device = await bluetoothNavigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service'],
      });

      const next: SavedDevice[] = [
        {
          id: device.id,
          name: device.name || 'Unnamed Bluetooth Device',
          addedAt: new Date().toISOString(),
        },
        ...devices.filter((item) => item.id !== device.id),
      ].slice(0, 12);

      persist(next);
      setMessage(`Paired ${device.name || 'Bluetooth device'} for quick operator reference on this machine.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Bluetooth pairing was cancelled or failed.');
    } finally {
      setBusy(false);
    }
  }

  function removeDevice(id: string) {
    persist(devices.filter((item) => item.id !== id));
  }

  return (
    <div className="section-stack">
      <section className="metric-card">
        <p className="eyebrow">Bluetooth Companion Devices</p>
        <p className="panel-title">Pair nearby devices for operator convenience and quick access</p>
        <p className="muted" style={{ marginTop: 8 }}>
          This browser-based console can register supported Bluetooth devices on this machine. The reliable way to open the full timer interface on a phone is still the Wi-Fi QR link.
        </p>
        <div className="status-chip-row" style={{ marginTop: 14 }}>
          <span className={`status-chip ${supported ? 'ok' : 'warn'}`}>{supported ? 'Web Bluetooth Supported' : 'Bluetooth Not Supported Here'}</span>
          <span className="status-chip">Wi-Fi QR is primary control path</span>
        </div>
        <div className="status-actions" style={{ marginTop: 14 }}>
          <button className="button-primary" onClick={() => void pairDevice()} disabled={!supported || busy}>
            {busy ? 'Pairing...' : 'Pair Bluetooth Device'}
          </button>
        </div>
        {message ? <div className="inline-alert" style={{ marginTop: 14 }}>{message}</div> : null}
      </section>

      <section className="metric-card">
        <p className="eyebrow">Saved Devices</p>
        <p className="panel-title">Local device registry for this operator machine</p>
        <div className="status-log-stack" style={{ marginTop: 14 }}>
          {devices.length ? devices.map((device) => (
            <div key={device.id} className="status-log-item">
              <span className="status-chip ok">paired</span>
              <div>
                <div className="compact-title">{device.name}</div>
                <div className="compact-copy">{device.id} · {new Date(device.addedAt).toLocaleString()}</div>
              </div>
              <button className="button-secondary" onClick={() => removeDevice(device.id)}>Remove</button>
            </div>
          )) : <div className="empty-state">No Bluetooth devices registered yet on this machine.</div>}
        </div>
      </section>
    </div>
  );
}
