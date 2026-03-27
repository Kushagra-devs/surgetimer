import { PageFrame } from '../../components/page-frame';

import { OverlayStudio } from '../../components/admin/overlay-studio';

export default function OverlayPreviewPage() {
  return (
    <PageFrame
      title="Overlay Preview"
      description="Open the dedicated live overlay route in vMix or use this preview entry from the admin side."
    >
      <div className="section-grid">
        <div className="metric-card">
          <p className="eyebrow">Broadcast Experience</p>
          <p className="panel-title">Premium arena overlay</p>
          <p className="muted">Large timing face, high-contrast label blocks, and presentation-side stats designed for confidence on screen.</p>
        </div>
        <div className="metric-card">
          <p className="eyebrow">Launch</p>
          <a className="action-button accent" href="/overlay/live">
            Open Live Overlay
          </a>
        </div>
      </div>
      <OverlayStudio compact />
    </PageFrame>
  );
}
