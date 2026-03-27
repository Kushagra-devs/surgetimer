import { DocumentationCenter } from '../../components/documentation-center';
import { PageFrame } from '../../components/page-frame';

export default function DocumentationPage() {
  return (
    <PageFrame
      title="Documentation"
      description="Feature-by-feature tutorials, operating guidance, and recovery instructions for the full platform."
      badge="Training & Help"
    >
      <DocumentationCenter />
    </PageFrame>
  );
}
