import { describe, expect, it } from 'vitest';
import { CsvService } from '../src/csv/csv.service';

describe('CSV validation', () => {
  it('reports per-row column mismatches', () => {
    const service = new CsvService();
    const preview = service.preview(['bibNumber,riderName,horseName', '101,Aarav Mehta,Silver Comet', '102,Naina Kapoor'].join('\n'));

    expect(preview.headers).toEqual(['bibNumber', 'riderName', 'horseName']);
    expect(preview.errors).toEqual([{ row: 3, message: 'Column count mismatch' }]);
  });
});

