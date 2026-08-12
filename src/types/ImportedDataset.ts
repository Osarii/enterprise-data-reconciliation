import type {
  ReconciliationRecord,
} from './ReconciliationRecord';

import type {
  DataQualityIssue,
  DataQualitySummary,
  DuplicateIdInfo,
} from './CsvValidation';

export interface ImportedDataset {
  fileName: string;
  fileSize: number;
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
}
