export type WorkloadTier =
  | 'Small'
  | 'Medium'
  | 'Large';

export interface DatasetProcessingMetrics {
  csvParseMs: number;
  validationMs: number;
  totalImportMs: number;
  rowsProcessed: number;
  rowsPerSecond: number;
  workloadTier: WorkloadTier;
}

export interface ReconciliationProcessingMetrics {
  durationMs: number;
  totalRowsProcessed: number;
  throughputRowsPerSecond: number;
  workloadTier: WorkloadTier;
}

export interface WorkspaceStorageMetrics {
  usedBytes: number;
  usedMegabytes: number;
  referenceLimitBytes: number;
  percentOfReferenceLimit: number;
  status:
    | 'Normal'
    | 'Approaching Limit'
    | 'High'
    | 'Unavailable';
}
