import type { ReactNode } from 'react';
import { Nav } from './nav';

export function PageFrame({
  title,
  description,
  badge = 'Operations Workspace',
  children,
}: {
  title: string;
  description: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <main className="page-shell">
      <div className="grid-shell">
        <Nav />
        <section className="content-card">
          <div className="hero-shell">
            <div className="hero-topline">{badge}</div>
            <h1 className="headline">{title}</h1>
            <p className="hero-copy" style={{ marginTop: 0, maxWidth: 760 }}>
              {description}
            </p>
            <div className="hero-metrics">
              <div className="hero-metric">
                <span className="hero-metric-label">Operator View</span>
                <span className="hero-metric-value">Clear, minimal, live-first</span>
              </div>
              <div className="hero-metric">
                <span className="hero-metric-label">Runtime Focus</span>
                <span className="hero-metric-value">Reliability and control</span>
              </div>
              <div className="hero-metric">
                <span className="hero-metric-label">Platform Goal</span>
                <span className="hero-metric-value">Scalable event operations</span>
              </div>
            </div>
          </div>
          <div className="content-inner">
            <div className="section-stack">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
