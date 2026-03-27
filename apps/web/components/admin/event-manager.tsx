'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { apiGet, apiPost } from '../../lib/api';

type EventRecord = {
  id: string;
  name: string;
  venue: string;
  timezone: string;
  status: string;
  arenaIds: string[];
  eventCode: string;
};

export function EventManager() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [form, setForm] = useState({ name: '', venue: '', timezone: 'Asia/Kolkata', status: 'DRAFT', eventCode: '', arenaIds: 'arena-grand' });

  async function load() {
    setEvents(await apiGet<EventRecord[]>('/events'));
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    await apiPost('/events', form);
    setForm({ name: '', venue: '', timezone: 'Asia/Kolkata', status: 'DRAFT', eventCode: '', arenaIds: 'arena-grand' });
    await load();
  }

  return (
    <div className="section-grid">
      <div className="metric-card">
        <p className="eyebrow">Create Event</p>
        <p className="panel-title">Event operations</p>
        <div className="info-list">
          <input style={inputStyle} placeholder="Event name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <input style={inputStyle} placeholder="Event code" value={form.eventCode} onChange={(event) => setForm({ ...form, eventCode: event.target.value })} />
          <input style={inputStyle} placeholder="Venue" value={form.venue} onChange={(event) => setForm({ ...form, venue: event.target.value })} />
          <input style={inputStyle} placeholder="Timezone" value={form.timezone} onChange={(event) => setForm({ ...form, timezone: event.target.value })} />
          <input style={inputStyle} placeholder="Arena IDs (comma separated)" value={form.arenaIds} onChange={(event) => setForm({ ...form, arenaIds: event.target.value })} />
          <select style={inputStyle} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <button className="action-button accent" onClick={() => void create()}>
            Create Event
          </button>
        </div>
      </div>
      <div className="metric-card">
        <p className="eyebrow">Current Events</p>
        <p className="panel-title">Venue schedule</p>
        <div className="table-shell">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Venue</th>
                <th>Arenas</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {events.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.eventCode}</td>
                  <td>{entry.name}</td>
                  <td>{entry.venue}</td>
                  <td>{entry.arenaIds?.length ?? 0}</td>
                  <td>{entry.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 14,
  border: '1px solid rgba(15,23,42,0.08)',
  background: '#ffffff',
  color: '#0f172a',
};
