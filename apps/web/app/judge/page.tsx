import { PageFrame } from '../../components/page-frame';
import { JudgePanel } from '../../components/judge-panel';

export default function JudgePage() {
  return (
    <PageFrame
      title="Judge Control Panel"
      description="Large controls, live sensor visibility, and resilient timer state for in-ring operations."
    >
      <JudgePanel />
    </PageFrame>
  );
}

