import type {
  FieldMapping,
} from './FieldMapping';

import type {
  ReconciliationRules,
} from './ReconciliationRules';

import type {
  ReconciliationSummary,
} from './ReconciliationResult';

import type {
  DatasetProcessingMetrics,
  ReconciliationProcessingMetrics,
} from './ProcessingMetrics';

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
  fieldMapping: FieldMapping;
  processing: DatasetProcessingMetrics;
}

export interface ReconciliationHistoryEntry {
  id: string;
  executedAt: string;
  erpDataset: ReconciliationHistoryDatasetSnapshot;
  crmDataset: ReconciliationHistoryDatasetSnapshot;
  summary: ReconciliationSummary;
  exceptionCount: number;
  reconciliationRules: ReconciliationRules;
  processing: {
    reconciliation: ReconciliationProcessingMetrics;
    observedPipelineMs: number;
  };
}
