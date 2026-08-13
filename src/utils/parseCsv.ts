import Papa from 'papaparse';

import {
  reconciliationRecordSchema,
} from '../schemas/reconciliationSchema';

import type {
  ReconciliationRecord,
} from '../types/ReconciliationRecord';

import type {
  DataQualityField,
  DataQualityIssue,
  DataQualitySummary,
  DuplicateIdInfo,
} from '../types/CsvValidation';

import type {
  FieldMapping,
} from '../types/FieldMapping';

import type {
  DatasetProcessingMetrics,
} from '../types/ProcessingMetrics';

import {
  DEFAULT_FIELD_MAPPING,
} from '../config/fieldMappingConfig';

import {
  buildDataQualitySummary,
  createSuspiciousIdIssue,
  getBlockingIssues,
  getWarningIssues,
  hasBlockingIssues,
} from './dataQuality';

import {
  getMappedSourceHeaders,
  normalizeHeaderName,
  validateFieldMapping,
} from './fieldMapping';

import {
  createDatasetProcessingMetrics,
  getNowMs,
} from './performanceMetrics';

export interface CsvParseResult {
  success: boolean;
  headers: string[];
  fieldMapping: FieldMapping;
  records: ReconciliationRecord[];

  /**
   * Compatibility view for the existing UI.
   * Source of truth is now `issues`.
   */
  errors: string[];

  /**
   * Compatibility view for the existing UI.
   * Source of truth is now `issues`.
   */
  warnings: string[];

  issues: DataQualityIssue[];
  qualitySummary: DataQualitySummary;
  duplicateIds: DuplicateIdInfo[];
  totalRows: number;

  /** Rows without blocking row-level issues. */
  validRows: number;

  /** Rows with one or more blocking row-level issues. */
  invalidRows: number;

  /** Rows with no blocking or warning row-level issues. */
  cleanRows: number;

  /** Rows with at least one blocking or warning row-level issue. */
  rowsWithIssues: number;
  qualityScore: number;
  processing: DatasetProcessingMetrics;
}

type RawCsvRow = Record<string, string>;

type RecordField =
  | 'id'
  | 'cliente'
  | 'monto'
  | 'estado';

export function parseCsv(
  file: File,
  fieldMapping: FieldMapping = DEFAULT_FIELD_MAPPING
): Promise<CsvParseResult> {
  const parseStartedAt = getNowMs();

  return new Promise((resolve, reject) => {
    Papa.parse<RawCsvRow>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: normalizeHeaderName,

      complete: (results) => {
        const validationStartedAt = getNowMs();
        const records: ReconciliationRecord[] = [];
        const issues: DataQualityIssue[] = [];
        const duplicateIds: DuplicateIdInfo[] = [];

        const issueRows = new Set<number>();
        const blockingRows = new Set<number>();
        const warningRows = new Set<number>();
        const duplicateRows = new Set<number>();
        const idOccurrences = new Map<string, number[]>();

        const totalRows = results.data.length;
        const headers = Array.from(
          new Set(
            (results.meta.fields ?? [])
              .map(normalizeHeaderName)
              .filter(Boolean)
          )
        );

        const normalizedMapping: FieldMapping = {
          id: normalizeHeaderName(fieldMapping.id),
          cliente: normalizeHeaderName(fieldMapping.cliente),
          monto: normalizeHeaderName(fieldMapping.monto),
          estado: normalizeHeaderName(fieldMapping.estado),
        };

        const addIssue = (issue: DataQualityIssue) => {
          issues.push(issue);

          if (typeof issue.row === 'number') {
            issueRows.add(issue.row);

            if (issue.severity === 'BLOCKING') {
              blockingRows.add(issue.row);
            } else {
              warningRows.add(issue.row);
            }
          }
        };

        /*
         * FIELD MAPPING VALIDATION
         */
        const mappingValidation = validateFieldMapping(
          headers,
          normalizedMapping
        );

        mappingValidation.errors
          .filter((message) => !message.includes('does not exist in the CSV'))
          .forEach((message) => {
            addIssue({
              type: 'Invalid Field Mapping',
              severity: 'BLOCKING',
              message,
              field: 'header',
            });
          });

        if (!mappingValidation.valid) {
          for (let index = 0; index < totalRows; index += 1) {
            const rowNumber = index + 2;
            issueRows.add(rowNumber);
            blockingRows.add(rowNumber);
          }
        }

        /*
         * HEADER VALIDATION
         *
         * The canonical schema remains id / cliente / monto / estado,
         * while each source can map different CSV headers into it.
         */
        const requiredMappedHeaders = getMappedSourceHeaders(
          normalizedMapping
        );

        const missingMappedHeaders = requiredMappedHeaders.filter(
          (requiredHeader) => !headers.includes(requiredHeader)
        );

        missingMappedHeaders.forEach((header) => {
          addIssue({
            type: 'Missing Column',
            severity: 'BLOCKING',
            message: `Missing mapped source column: ${header}.`,
            field: 'header',
            value: header,
          });
        });

        if (missingMappedHeaders.length > 0) {
          for (let index = 0; index < totalRows; index += 1) {
            const rowNumber = index + 2;
            issueRows.add(rowNumber);
            blockingRows.add(rowNumber);
          }
        }

        const mappedHeaderSet = new Set(requiredMappedHeaders);

        const unexpectedHeaders = headers.filter(
          (header) => !mappedHeaderSet.has(header)
        );

        unexpectedHeaders.forEach((header) => {
          addIssue({
            type: 'Unexpected Column',
            severity: 'WARNING',
            message: `Unexpected unmapped column: ${header}.`,
            field: 'header',
            value: header,
          });
        });

        /*
         * EMPTY FILE
         */
        if (totalRows === 0) {
          addIssue({
            type: 'Empty File',
            severity: 'BLOCKING',
            message: 'The CSV file contains no data rows.',
            field: 'csv',
          });
        }

        /*
         * PAPA PARSE ERRORS
         */
        results.errors.forEach((parseError) => {
          const rowNumber =
            typeof parseError.row === 'number'
              ? parseError.row + 2
              : undefined;

          addIssue({
            type: 'CSV Parse Error',
            severity: 'BLOCKING',
            message: rowNumber
              ? `Row ${rowNumber}: ${parseError.message}`
              : `CSV error: ${parseError.message}`,
            row: rowNumber,
            field: 'csv',
          });
        });

        /*
         * ROW VALIDATION
         */
        if (mappingValidation.valid && missingMappedHeaders.length === 0) {
          results.data.forEach((row, index) => {
            const rowNumber = index + 2;
            const canonicalRow = mapRawRowToCanonical(
              row,
              normalizedMapping
            );

            const rawId = String(canonicalRow.id ?? '');
            const trimmedId = rawId.trim();

            /*
             * Track IDs before schema validation so duplicate detection
             * still works when another canonical field is invalid.
             */
            if (trimmedId) {
              const currentRows = idOccurrences.get(trimmedId) ?? [];
              currentRows.push(rowNumber);
              idOccurrences.set(trimmedId, currentRows);

              const suspiciousIdIssue = createSuspiciousIdIssue(
                rawId,
                rowNumber
              );

              if (suspiciousIdIssue) {
                addIssue(suspiciousIdIssue);
              }
            }

            const validation =
              reconciliationRecordSchema.safeParse(canonicalRow);

            if (!validation.success) {
              const invalidFields = new Set<RecordField>();

              validation.error.issues.forEach((issue) => {
                const field = issue.path[0];

                if (
                  field === 'id' ||
                  field === 'cliente' ||
                  field === 'monto' ||
                  field === 'estado'
                ) {
                  invalidFields.add(field);
                }
              });

              invalidFields.forEach((field) => {
                addIssue(
                  createFieldValidationIssue(
                    field,
                    canonicalRow[field],
                    rowNumber
                  )
                );
              });

              return;
            }

            records.push(validation.data);
          });
        }

        /*
         * DUPLICATE ID DETECTION
         */
        idOccurrences.forEach((rows, id) => {
          if (rows.length <= 1) {
            return;
          }

          duplicateIds.push({
            id,
            rows: [...rows],
          });

          rows.forEach((rowNumber) => {
            issueRows.add(rowNumber);
            blockingRows.add(rowNumber);
            duplicateRows.add(rowNumber);
          });

          addIssue({
            type: 'Duplicate ID',
            severity: 'BLOCKING',
            message: `Duplicate ID "${id}" found on rows ${rows.join(
              ', '
            )}.`,
            field: 'id',
            value: id,
            relatedRows: [...rows],
          });
        });

        duplicateIds.sort(
          (a, b) => a.rows[0] - b.rows[0]
        );

        /*
         * DATA QUALITY SCORE V2
         *
         * This is an application-defined scoring model. It is not
         * presented as an external or international data-quality standard.
         */
        const qualitySummary = buildDataQualitySummary({
          issues,
          totalRows,
          issueRows,
          blockingRows,
          warningRows,
          duplicateRows,
        });

        const blockingIssues = getBlockingIssues(issues);
        const warningIssues = getWarningIssues(issues);

        const errors = blockingIssues.map((issue) => issue.message);
        const warnings = warningIssues.map((issue) => issue.message);

        const validRows = Math.max(
          totalRows - blockingRows.size,
          0
        );

        const invalidRows = Math.min(
          blockingRows.size,
          totalRows
        );

        const success =
          !hasBlockingIssues(issues) && totalRows > 0;

        const completedAt = getNowMs();
        const processing = createDatasetProcessingMetrics(
          validationStartedAt - parseStartedAt,
          completedAt - validationStartedAt,
          totalRows
        );

        resolve({
          success,
          headers,
          fieldMapping: normalizedMapping,
          records,
          errors,
          warnings,
          issues,
          qualitySummary,
          duplicateIds,
          totalRows,
          validRows,
          invalidRows,
          cleanRows: qualitySummary.cleanRows,
          rowsWithIssues: qualitySummary.rowsWithIssues,
          qualityScore: qualitySummary.score,
          processing,
        });
      },

      error: (error) => {
        reject(error);
      },
    });
  });
}

function mapRawRowToCanonical(
  row: RawCsvRow,
  mapping: FieldMapping
): Record<RecordField, string> {
  return {
    id: String(row[mapping.id] ?? ''),
    cliente: String(row[mapping.cliente] ?? ''),
    monto: String(row[mapping.monto] ?? ''),
    estado: String(row[mapping.estado] ?? ''),
  };
}

function createFieldValidationIssue(
  field: RecordField,
  rawValue: string | undefined,
  rowNumber: number
): DataQualityIssue {
  const value = String(rawValue ?? '');
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return {
      type: 'Missing Value',
      severity: 'BLOCKING',
      message: `Row ${rowNumber} — ${field}: Required value is missing.`,
      row: rowNumber,
      field: field as DataQualityField,
      value,
    };
  }

  if (field === 'monto') {
    const numericValue = Number(trimmedValue);

    if (!Number.isFinite(numericValue)) {
      return {
        type: 'Invalid Amount',
        severity: 'BLOCKING',
        message: `Row ${rowNumber} — monto: "${trimmedValue}" is not a valid number.`,
        row: rowNumber,
        field: 'monto',
        value: trimmedValue,
      };
    }

    return {
      type: 'Negative Amount',
      severity: 'BLOCKING',
      message: `Row ${rowNumber} — monto: Amount cannot be negative (${numericValue}).`,
      row: rowNumber,
      field: 'monto',
      value: numericValue,
    };
  }

  if (field === 'estado') {
    return {
      type: 'Invalid Status',
      severity: 'BLOCKING',
      message: `Row ${rowNumber} — estado: "${trimmedValue}" is not an allowed status.`,
      row: rowNumber,
      field: 'estado',
      value: trimmedValue,
    };
  }

  return {
    type: 'Missing Value',
    severity: 'BLOCKING',
    message: `Row ${rowNumber} — ${field}: Invalid required value.`,
    row: rowNumber,
    field: field as DataQualityField,
    value: trimmedValue,
  };
}
