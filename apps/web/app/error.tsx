'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="page-shell">
          <div className="error-shell">
            <div className="metric-card error-card">
              <p className="eyebrow">Application Error</p>
              <h1 className="headline" style={{ fontSize: 'clamp(2rem, 4vw, 3.4rem)' }}>
                The workspace hit an unexpected problem.
              </h1>
              <p className="hero-copy" style={{ maxWidth: 680 }}>
                The app stayed online, but this view failed to render correctly. You can retry this screen or return to the main dashboard.
              </p>
              <div className="warning-banner" style={{ marginTop: 16 }}>
                {error.message || 'Unknown application error.'}
              </div>
              <div className="button-grid" style={{ marginTop: 18 }}>
                <button className="action-button accent" onClick={() => reset()}>
                  Retry View
                </button>
                <a className="action-button" href="/dashboard">
                  Go to Dashboard
                </a>
                <a className="action-button" href="/documentation">
                  Open Documentation
                </a>
              </div>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
