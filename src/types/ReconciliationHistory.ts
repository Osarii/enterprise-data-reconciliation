import type {
  ReconciliationSummary,
} from './ReconciliationResult';

export interface ReconciliationHistoryDatasetSnapshot {
  fileName: string;
  fileSize: number;
  totalRows: number;
  cleanRows: number;
  rowsWithIssues: number;
  qualityScore: number;
  blockingIssues: number;
  warnings: number;
  duplicateIds: number;
}

export interface ReconciliationHistoryEntry {
  id: string;
  executedAt: string;
  erpDataset: ReconciliationHistoryDatasetSnapshot;
  crmDataset: ReconciliationHistoryDatasetSnapshot;
  summary: ReconciliationSummary;
  exceptionCount: number;
}
