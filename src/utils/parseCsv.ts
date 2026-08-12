import Papa from 'papaparse';

import {
  reconciliationRecordSchema,
} from '../schemas/reconciliationSchema';

import type {
  ReconciliationRecord,
} from '../types/ReconciliationRecord';

import type {
  DuplicateIdInfo,
} from '../types/CsvValidation';

export interface CsvParseResult {
  success: boolean;

  records: ReconciliationRecord[];

  errors: string[];

  warnings: string[];

  duplicateIds: DuplicateIdInfo[];

  totalRows: number;

  validRows: number;

  invalidRows: number;

  qualityScore: number;
}

const REQUIRED_HEADERS = [
  'id',
  'cliente',
  'monto',
  'estado',
];

export function parseCsv(
  file: File
): Promise<CsvParseResult> {
  return new Promise(
    (resolve, reject) => {
      Papa.parse<
        Record<string, string>
      >(file, {
        header: true,

        skipEmptyLines: 'greedy',

        transformHeader: (
          header
        ) =>
          header
            .trim()
            .toLowerCase(),

        complete: (results) => {
          const records:
            ReconciliationRecord[] =
              [];

          const errors:
            string[] = [];

          const warnings:
            string[] = [];

          const issueRows =
            new Set<number>();

          const idOccurrences =
            new Map<
              string,
              number[]
            >();

          const totalRows =
            results.data.length;

          const headers =
            results.meta.fields ?? [];

          /*
           * HEADER VALIDATION
           */
          const missingHeaders =
            REQUIRED_HEADERS.filter(
              (requiredHeader) =>
                !headers.includes(
                  requiredHeader
                )
            );

          if (
            missingHeaders.length >
            0
          ) {
            errors.push(
              `Missing required column${
                missingHeaders.length >
                1
                  ? 's'
                  : ''
              }: ${missingHeaders.join(
                ', '
              )}`
            );

            for (
              let index = 0;
              index < totalRows;
              index += 1
            ) {
              issueRows.add(
                index + 2
              );
            }
          }

          const unexpectedHeaders =
            headers.filter(
              (header) =>
                !REQUIRED_HEADERS.includes(
                  header
                )
            );

          if (
            unexpectedHeaders.length >
            0
          ) {
            warnings.push(
              `Unexpected column${
                unexpectedHeaders.length >
                1
                  ? 's'
                  : ''
              }: ${unexpectedHeaders.join(
                ', '
              )}`
            );
          }

          /*
           * EMPTY FILE
           */
          if (totalRows === 0) {
            errors.push(
              'The CSV file contains no data rows.'
            );
          }

          /*
           * PAPA PARSE ERRORS
           */
          results.errors.forEach(
            (parseError) => {
              const rowNumber =
                typeof parseError.row ===
                'number'
                  ? parseError.row + 2
                  : null;

              errors.push(
                rowNumber
                  ? `Row ${rowNumber}: ${parseError.message}`
                  : `CSV error: ${parseError.message}`
              );

              if (rowNumber) {
                issueRows.add(
                  rowNumber
                );
              }
            }
          );

          /*
           * ROW VALIDATION
           */
          results.data.forEach(
            (row, index) => {
              const rowNumber =
                index + 2;

              /*
               * Track IDs before
               * schema validation.
               *
               * This allows duplicate
               * detection even when
               * another field in that
               * row is invalid.
               */
              const rawId =
                String(
                  row.id ?? ''
                ).trim();

              if (rawId) {
                const currentRows =
                  idOccurrences.get(
                    rawId
                  ) ?? [];

                currentRows.push(
                  rowNumber
                );

                idOccurrences.set(
                  rawId,
                  currentRows
                );
              }

              const validation =
                reconciliationRecordSchema.safeParse(
                  row
                );

              if (
                !validation.success
              ) {
                issueRows.add(
                  rowNumber
                );

                validation.error.issues.forEach(
                  (issue) => {
                    const field =
                      issue.path.length >
                      0
                        ? String(
                            issue
                              .path[0]
                          )
                        : 'row';

                    errors.push(
                      `Row ${rowNumber} — ${field}: ${issue.message}`
                    );
                  }
                );

                return;
              }

              records.push(
                validation.data
              );
            }
          );

          /*
           * DUPLICATE ID DETECTION
           */
          const duplicateIds:
            DuplicateIdInfo[] =
              [];

          idOccurrences.forEach(
            (rows, id) => {
              if (
                rows.length <= 1
              ) {
                return;
              }

              duplicateIds.push({
                id,
                rows,
              });

              rows.forEach(
                (rowNumber) => {
                  issueRows.add(
                    rowNumber
                  );
                }
              );

              errors.push(
                `Duplicate ID "${id}" found on rows ${rows.join(
                  ', '
                )}.`
              );
            }
          );

          duplicateIds.sort(
            (a, b) =>
              a.rows[0] -
              b.rows[0]
          );

          /*
           * QUALITY METRICS
           */
          const invalidRows =
            Math.min(
              issueRows.size,
              totalRows
            );

          const validRows =
            Math.max(
              totalRows -
                invalidRows,
              0
            );

          const qualityScore =
            totalRows === 0
              ? 0
              : Math.round(
                  (validRows /
                    totalRows) *
                    1000
                ) / 10;

          const success =
            errors.length === 0 &&
            totalRows > 0;

          resolve({
            success,

            records,

            errors,

            warnings,

            duplicateIds,

            totalRows,

            validRows,

            invalidRows,

            qualityScore,
          });
        },

        error: (error) => {
          reject(error);
        },
      });
    }
  );
}