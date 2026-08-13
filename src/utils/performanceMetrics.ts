import {
  MEDIUM_DATASET_MAX_ROWS,
  SMALL_DATASET_MAX_ROWS,
} from '../config/performanceConfig';

import type {
  DatasetProcessingMetrics,
  ReconciliationProcessingMetrics,
  WorkloadTier,
} from '../types/ProcessingMetrics';

import type {
  ImportedDataset,
} from '../types/ImportedDataset';

import type {
  ReconciliationHistoryEntry,
} from '../types/ReconciliationHistory';

export function getNowMs(): number {
  if (
    typeof performance !== 'undefined' &&
    typeof performance.now === 'function'
  ) {
    return performance.now();
  }

  return Date.now();
}

export function getWorkloadTier(
  rows: number
): WorkloadTier {
  if (rows <= SMALL_DATASET_MAX_ROWS) {
    return 'Small';
  }

  if (rows <= MEDIUM_DATASET_MAX_ROWS) {
    return 'Medium';
  }

  return 'Large';
}

export function createDatasetProcessingMetrics(
  csvParseMs: number,
  validationMs: number,
  rowsProcessed: number
): DatasetProcessingMetrics {
  const safeParseMs = sanitizeDuration(csvParseMs);
  const safeValidationMs = sanitizeDuration(validationMs);
  const totalImportMs = roundDuration(
    safeParseMs + safeValidationMs
  );

  return {
    csvParseMs: roundDuration(safeParseMs),
    validationMs: roundDuration(safeValidationMs),
    totalImportMs,
    rowsProcessed,
    rowsPerSecond: calculateRowsPerSecond(
      rowsProcessed,
      totalImportMs
    ),
    workloadTier: getWorkloadTier(rowsProcessed),
  };
}

export function createReconciliationProcessingMetrics(
  durationMs: number,
  totalRowsProcessed: number
): ReconciliationProcessingMetrics {
  const safeDuration = roundDuration(
    sanitizeDuration(durationMs)
  );

  return {
    durationMs: safeDuration,
    totalRowsProcessed,
    throughputRowsPerSecond: calculateRowsPerSecond(
      totalRowsProcessed,
      safeDuration
    ),
    workloadTier: getWorkloadTier(totalRowsProcessed),
  };
}

export function getObservedPipelineMs(
  erpData: Pick<ImportedDataset, 'processing'>,
  crmData: Pick<ImportedDataset, 'processing'>,
  reconciliation:
    ReconciliationProcessingMetrics
): number {
  return roundDuration(
    erpData.processing.totalImportMs +
      crmData.processing.totalImportMs +
      reconciliation.durationMs
  );
}

export function calculateAverageHistoryProcessingTime(
  history: ReconciliationHistoryEntry[]
): number {
  const measuredEntries = history.filter(
    (entry) => entry.processing.reconciliation.durationMs > 0
  );

  if (measuredEntries.length === 0) {
    return 0;
  }

  return roundDuration(
    measuredEntries.reduce(
      (sum, entry) =>
        sum + entry.processing.reconciliation.durationMs,
      0
    ) / measuredEntries.length
  );
}

export function calculateAverageHistoryThroughput(
  history: ReconciliationHistoryEntry[]
): number {
  if (history.length === 0) {
    return 0;
  }

  const validEntries = history.filter(
    (entry) =>
      Number.isFinite(
        entry.processing.reconciliation
          .throughputRowsPerSecond
      ) &&
      entry.processing.reconciliation
        .throughputRowsPerSecond > 0
  );

  if (validEntries.length === 0) {
    return 0;
  }

  return Math.round(
    validEntries.reduce(
      (sum, entry) =>
        sum +
        entry.processing.reconciliation
          .throughputRowsPerSecond,
      0
    ) / validEntries.length
  );
}

export function getLargestHistoryRunRows(
  history: ReconciliationHistoryEntry[]
): number {
  if (history.length === 0) {
    return 0;
  }

  return Math.max(
    ...history.map(
      (entry) =>
        entry.processing.reconciliation
          .totalRowsProcessed
    )
  );
}

export function formatDuration(
  durationMs: number
): string {
  if (durationMs < 1) {
    return `${durationMs.toFixed(2)} ms`;
  }

  if (durationMs < 1_000) {
    return `${durationMs.toFixed(1)} ms`;
  }

  return `${(durationMs / 1_000).toFixed(2)} s`;
}

export function formatThroughput(
  rowsPerSecond: number
): string {
  if (!Number.isFinite(rowsPerSecond)) {
    return '0 rows/s';
  }

  return `${Math.round(rowsPerSecond).toLocaleString()} rows/s`;
}

function calculateRowsPerSecond(
  rows: number,
  durationMs: number
): number {
  if (rows <= 0 || durationMs <= 0) {
    return 0;
  }

  return Math.round(
    rows / (durationMs / 1_000)
  );
}

function sanitizeDuration(
  value: number
): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return value;
}

function roundDuration(
  value: number
): number {
  return Math.round(value * 100) / 100;
}
