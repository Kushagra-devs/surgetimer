'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { apiGet, apiPost } from '../../lib/api';

type Competitor = {
  id: string;
  classId: string;
  riderName: string;
  horseName: string;
  bibNumber: string;
  startOrder: number;
  status: string;
};

export function CompetitorManager() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [form, setForm] = useState({
    classId: 'class-demo',
    riderName: '',
    horseName: '',
    bibNumber: '',
    startOrder: '1',
  });

  async function load() {
    setCompetitors(await apiGet<Competitor[]>('/competitors'));
  }

  useEffect(() => {
    void load();
  }, []);

  async function create() {
    await apiPost('/competitors', form);
    setForm({ classId: 'class-demo', riderName: '', horseName: '', bibNumber: '', startOrder: '1' });
    await load();
  }

  return (
    <div className="section-grid">
      <div className="metric-card">
        <p className="eyebrow">Create Competitor</p>
        <p className="panel-title">Start list control</p>
        <div className="info-list">
          <input style={inputStyle} placeholder="Class ID" value={form.classId} onChange={(event) => setForm({ ...form, classId: event.target.value })} />
          <input style={inputStyle} placeholder="Rider name" value={form.riderName} onChange={(event) => setForm({ ...form, riderName: event.target.value })} />
          <input style={inputStyle} placeholder="Horse name" value={form.horseName} onChange={(event) => setForm({ ...form, horseName: event.target.value })} />
          <input style={inputStyle} placeholder="Bib number" value={form.bibNumber} onChange={(event) => setForm({ ...form, bibNumber: event.target.value })} />
          <input style={inputStyle} placeholder="Start order" value={form.startOrder} onChange={(event) => setForm({ ...form, startOrder: event.target.value })} />
          <button className="action-button accent" onClick={() => void create()}>
            Add Competitor
          </button>
        </div>
      </div>
      <div className="metric-card">
        <p className="eyebrow">Current Entries</p>
        <p className="panel-title">Operational field list</p>
        <div className="table-shell">
          <table className="table">
            <thead>
              <tr>
                <th>Bib</th>
                <th>Rider</th>
                <th>Horse</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((competitor) => (
                <tr key={competitor.id}>
                  <td>{competitor.bibNumber}</td>
                  <td>{competitor.riderName}</td>
                  <td>{competitor.horseName}</td>
                  <td>{competitor.status}</td>
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
