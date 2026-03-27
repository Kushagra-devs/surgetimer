import { PageFrame } from '../../components/page-frame';
import { SimpleTable } from '../../components/simple-table';

export default function ClassesPage() {
  return (
    <PageFrame title="Classes" description="Competition classes with warm-up and max-round configuration.">
      <SimpleTable title="Classes" columns={['Code', 'Name']} rows={[['GP140', '1.40m Grand Prix']]} />
    </PageFrame>
  );
}

