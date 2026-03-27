import { Injectable } from '@nestjs/common';

type CsvPreviewResult = {
  headers: string[];
  rows: string[][];
  errors: Array<{ row: number; message: string }>;
};

@Injectable()
export class CsvService {
  preview(content: string): CsvPreviewResult {
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const headers = (lines.shift() ?? '').split(',').map((item) => item.trim());
    const rows = lines.map((line) => line.split(',').map((item) => item.trim()));
    const errors = rows.flatMap((row, index) => {
      if (row.length !== headers.length) {
        return [{ row: index + 2, message: 'Column count mismatch' }];
      }
      return [];
    });

    return { headers, rows, errors };
  }
}

