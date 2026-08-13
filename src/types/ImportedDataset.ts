import type {
  ReconciliationRecord,
} from './ReconciliationRecord';

import type {
  DataQualityIssue,
  DataQualitySummary,
  DuplicateIdInfo,
} from './CsvValidation';

import type {
  FieldMapping,
} from './FieldMapping';

import type {
  DatasetProcessingMetrics,
} from './ProcessingMetrics';

export interface ImportedDataset {
  fileName: string;
  fileSize: number;
  headers: string[];
  fieldMapping: FieldMapping;
  records: ReconciliationRecord[];
  errors: string[];
  warnings: string[];
  issues: DataQualityIssue[];
  qualitySummary: DataQualitySummary;
  duplicateIds: DuplicateIdInfo[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  cleanRows: number;
  rowsWithIssues: number;
  qualityScore: number;
  processing: DatasetProcessingMetrics;
}
