import Papa from 'papaparse';

import { reconciliationRecordSchema } from '../schemas/reconciliationSchema';

import type { ReconciliationRecord } from '../types/ReconciliationRecord';

export interface CsvParseResult {
  success: boolean;
  records: ReconciliationRecord[];
  errors: string[];
  totalRows: number;
}

export function parseCsv(file: File): Promise<CsvParseResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),

      complete: (results) => {
        const records: ReconciliationRecord[] = [];
        const errors: string[] = [];

        if (results.errors.length > 0) {
          results.errors.forEach((error) => {
            errors.push(
              `CSV error on row ${error.row ?? 'unknown'}: ${error.message}`
            );
          });
        }

        results.data.forEach((row, index) => {
          const validation = reconciliationRecordSchema.safeParse(row);

          if (validation.success) {
            records.push(validation.data);
          } else {
            const messages = validation.error.issues
              .map((issue) => issue.message)
              .join(', ');

            errors.push(`Row ${index + 2}: ${messages}`);
          }
        });

        resolve({
          success: errors.length === 0,
          records,
          errors,
          totalRows: results.data.length,
        });
      },

      error: (error) => {
        resolve({
          success: false,
          records: [],
          errors: [error.message],
          totalRows: 0,
        });
      },
    });
  });
}