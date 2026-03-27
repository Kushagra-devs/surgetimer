import { PageFrame } from '../../components/page-frame';
import { SimpleTable } from '../../components/simple-table';

export default function QueuePage() {
  return (
    <PageFrame title="Queue Manager" description="Active start order and next-competitor flow for the in-gate operator.">
      <SimpleTable
        title="Queue"
        columns={['Position', 'Bib', 'Rider']}
        rows={[
          ['1', '101', 'Aarav Mehta'],
          ['2', '102', 'Naina Kapoor'],
        ]}
      />
    </PageFrame>
  );
}

