export default function NotFoundPage() {
  return (
    <main className="page-shell">
      <div className="error-shell">
        <div className="metric-card error-card">
          <p className="eyebrow">Page Not Found</p>
          <h1 className="headline" style={{ fontSize: 'clamp(2rem, 4vw, 3.4rem)' }}>
            This route does not exist.
          </h1>
          <p className="hero-copy" style={{ maxWidth: 680 }}>
            Use the main navigation to return to the live workspace, or open the documentation center for guided help.
          </p>
          <div className="button-grid" style={{ marginTop: 18 }}>
            <a className="action-button accent" href="/dashboard">
              Dashboard
            </a>
            <a className="action-button" href="/super-admin">
              Super Admin
            </a>
            <a className="action-button" href="/documentation">
              Documentation
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
