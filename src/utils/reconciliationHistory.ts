import type {
  ImportedDataset,
} from '../types/ImportedDataset';

import type {
  ReconciliationHistoryDatasetSnapshot,
  ReconciliationHistoryEntry,
} from '../types/ReconciliationHistory';

import type {
  ReconciliationResult,
} from '../types/ReconciliationResult';

export function createReconciliationHistoryEntry(
  result: ReconciliationResult,
  erpData: ImportedDataset,
  crmData: ImportedDataset
): ReconciliationHistoryEntry {
  return {
    id: createHistoryId(result.executedAt),
    executedAt: result.executedAt,
    erpDataset: createDatasetSnapshot(erpData),
    crmDataset: createDatasetSnapshot(crmData),
    summary: {
      ...result.summary,
    },
    exceptionCount:
      result.summary.differences +
      result.summary.onlyERP +
      result.summary.onlyCRM,
  };
}

export function calculateAverageHistoryMatchRate(
  history: ReconciliationHistoryEntry[]
): number {
  if (history.length === 0) {
    return 0;
  }

  const total = history.reduce(
    (sum, entry) => sum + entry.summary.matchRate,
    0
  );

  return total / history.length;
}

export function calculateBestHistoryMatchRate(
  history: ReconciliationHistoryEntry[]
): number {
  if (history.length === 0) {
    return 0;
  }

  return Math.max(
    ...history.map((entry) => entry.summary.matchRate)
  );
}

export function calculateAverageHistoryQuality(
  history: ReconciliationHistoryEntry[]
): number {
  if (history.length === 0) {
    return 0;
  }

  const total = history.reduce(
    (sum, entry) =>
      sum +
      (entry.erpDataset.qualityScore +
        entry.crmDataset.qualityScore) /
        2,
    0
  );

  return total / history.length;
}

export function getHistoryEntryAverageQuality(
  entry: ReconciliationHistoryEntry
): number {
  return (
    (entry.erpDataset.qualityScore +
      entry.crmDataset.qualityScore) /
    2
  );
}

function createDatasetSnapshot(
  dataset: ImportedDataset
): ReconciliationHistoryDatasetSnapshot {
  return {
    fileName: dataset.fileName,
    fileSize: dataset.fileSize,
    totalRows: dataset.totalRows,
    cleanRows: dataset.cleanRows,
    rowsWithIssues: dataset.rowsWithIssues,
    qualityScore: dataset.qualityScore,
    blockingIssues: dataset.qualitySummary.blockingIssues,
    warnings: dataset.qualitySummary.warnings,
    duplicateIds: dataset.qualitySummary.duplicateIds,
    fieldMapping: { ...dataset.fieldMapping },
  };
}

function createHistoryId(executedAt: string): string {
  const suffix = Math.random()
    .toString(36)
    .slice(2, 8);

  return `reconciliation-${executedAt}-${suffix}`;
}
