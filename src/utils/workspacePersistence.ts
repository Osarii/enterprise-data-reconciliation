import {
  WORKSPACE_STORAGE_KEY,
  WORKSPACE_STORAGE_VERSION,
} from '../config/storageConfig';

import {
  FULL_WORKSPACE_PERSISTENCE_MAX_ROWS,
  WORKSPACE_STORAGE_HIGH_RATIO,
  WORKSPACE_STORAGE_REFERENCE_BYTES,
  WORKSPACE_STORAGE_WARNING_RATIO,
} from '../config/performanceConfig';

import {
  DEFAULT_FIELD_MAPPING,
} from '../config/fieldMappingConfig';

import {
  DEFAULT_RECONCILIATION_RULES,
} from '../config/reconciliationRulesConfig';

import type {
  ImportedDataset,
} from '../types/ImportedDataset';

import type {
  DatasetFieldMappings,
  FieldMapping,
} from '../types/FieldMapping';

import type {
  ReconciliationHistoryEntry,
} from '../types/ReconciliationHistory';

import type {
  MatchedRecord,
  ReconciliationResult,
  ReconciliationSummary,
} from '../types/ReconciliationResult';

import type {
  ReconciliationRules,
} from '../types/ReconciliationRules';

import type {
  DatasetProcessingMetrics,
  ReconciliationProcessingMetrics,
  WorkspaceStorageMetrics,
} from '../types/ProcessingMetrics';

import {
  createDatasetProcessingMetrics,
  createReconciliationProcessingMetrics,
} from './performanceMetrics';

export type WorkspacePersistenceMode =
  | 'full'
  | 'summary-only';

export interface PersistedWorkspace {
  version: typeof WORKSPACE_STORAGE_VERSION;
  savedAt: string;
  persistenceMode: WorkspacePersistenceMode;
  erpData: ImportedDataset | null;
  crmData: ImportedDataset | null;
  reconciliationResult: ReconciliationResult | null;
  reviewedExceptionKeys: string[];
  reconciliationHistory: ReconciliationHistoryEntry[];
  fieldMappings: DatasetFieldMappings;
  reconciliationRules: ReconciliationRules;
}

export interface WorkspacePersistenceResult {
  success: boolean;
  savedAt: string | null;
  error: string | null;
  mode: WorkspacePersistenceMode;
  storageMetrics: WorkspaceStorageMetrics;
}

interface WorkspaceStateToPersist {
  erpData: ImportedDataset | null;
  crmData: ImportedDataset | null;
  reconciliationResult: ReconciliationResult | null;
  reviewedExceptionKeys: string[];
  reconciliationHistory: ReconciliationHistoryEntry[];
  fieldMappings: DatasetFieldMappings;
  reconciliationRules: ReconciliationRules;
}

export function loadWorkspace(): PersistedWorkspace | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(
      WORKSPACE_STORAGE_KEY
    );

    if (!rawValue) {
      return null;
    }

    const parsedValue: unknown = JSON.parse(rawValue);
    const normalized = normalizeWorkspace(parsedValue);

    if (normalized) {
      return normalized;
    }

    window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    return null;
  } catch {
    safelyRemoveWorkspace();
    return null;
  }
}

export function saveWorkspace(
  state: WorkspaceStateToPersist
): WorkspacePersistenceResult {
  if (!canUseLocalStorage()) {
    return {
      success: false,
      savedAt: null,
      error:
        'Browser storage is unavailable. Workspace changes will remain only in memory.',
      mode: 'summary-only',
      storageMetrics: createUnavailableStorageMetrics(),
    };
  }

  const hasPersistableData = Boolean(
    state.erpData ||
      state.crmData ||
      state.reconciliationResult ||
      state.reviewedExceptionKeys.length > 0 ||
      state.reconciliationHistory.length > 0 ||
      !areDatasetFieldMappingsDefault(state.fieldMappings) ||
      !areReconciliationRulesDefault(state.reconciliationRules)
  );

  if (!hasPersistableData) {
    try {
      window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);

      return {
        success: true,
        savedAt: null,
        error: null,
        mode: 'full',
        storageMetrics: createWorkspaceStorageMetrics(0),
      };
    } catch {
      return {
        success: false,
        savedAt: null,
        error:
          'The empty workspace could not be synchronized with browser storage.',
        mode: 'summary-only',
        storageMetrics: getWorkspaceStorageMetrics(),
      };
    }
  }

  const savedAt = new Date().toISOString();
  const combinedRows =
    (state.erpData?.records.length ?? 0) +
    (state.crmData?.records.length ?? 0);

  const preferredMode: WorkspacePersistenceMode =
    combinedRows > FULL_WORKSPACE_PERSISTENCE_MAX_ROWS
      ? 'summary-only'
      : 'full';

  const preferredWorkspace = createPersistedWorkspace(
    state,
    savedAt,
    preferredMode
  );

  const preferredResult = writeWorkspace(preferredWorkspace);

  if (preferredResult.success) {
    return preferredResult;
  }

  /*
   * A browser can expose a smaller localStorage quota than our
   * application reference point. If a full save hits the quota,
   * automatically retry with a compact snapshot instead of leaving
   * the user with a failed auto-save state.
   */
  if (preferredMode === 'full') {
    const compactWorkspace = createPersistedWorkspace(
      state,
      savedAt,
      'summary-only'
    );

    const compactResult = writeWorkspace(compactWorkspace);

    if (compactResult.success) {
      return compactResult;
    }
  }

  return preferredResult;
}

function createPersistedWorkspace(
  state: WorkspaceStateToPersist,
  savedAt: string,
  mode: WorkspacePersistenceMode
): PersistedWorkspace {
  const persistFullWorkspace = mode === 'full';

  return {
    version: WORKSPACE_STORAGE_VERSION,
    savedAt,
    persistenceMode: mode,
    erpData: persistFullWorkspace ? state.erpData : null,
    crmData: persistFullWorkspace ? state.crmData : null,
    reconciliationResult: persistFullWorkspace
      ? state.reconciliationResult
      : null,
    reviewedExceptionKeys: persistFullWorkspace
      ? state.reviewedExceptionKeys
      : [],
    reconciliationHistory: state.reconciliationHistory,
    fieldMappings: state.fieldMappings,
    reconciliationRules: state.reconciliationRules,
  };
}

function writeWorkspace(
  workspace: PersistedWorkspace
): WorkspacePersistenceResult {
  try {
    const serializedWorkspace = JSON.stringify(workspace);

    window.localStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      serializedWorkspace
    );

    return {
      success: true,
      savedAt: workspace.savedAt,
      error: null,
      mode: workspace.persistenceMode,
      storageMetrics: createWorkspaceStorageMetrics(
        getTextByteLength(serializedWorkspace)
      ),
    };
  } catch (error: unknown) {
    return {
      success: false,
      savedAt: null,
      error: getPersistenceErrorMessage(error),
      mode: workspace.persistenceMode,
      storageMetrics: getWorkspaceStorageMetrics(),
    };
  }
}

export function clearPersistedWorkspace(): boolean {
  if (!canUseLocalStorage()) {
    return false;
  }

  try {
    window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

function normalizeWorkspace(
  value: unknown
): PersistedWorkspace | null {
  if (!isObject(value)) {
    return null;
  }

  if (
    value.version !== 1 &&
    value.version !== 2 &&
    value.version !== 3 &&
    value.version !== 4 &&
    value.version !== 5 &&
    value.version !== WORKSPACE_STORAGE_VERSION
  ) {
    return null;
  }

  if (typeof value.savedAt !== 'string') {
    return null;
  }

  const erpData = normalizeImportedDataset(value.erpData);
  const crmData = normalizeImportedDataset(value.crmData);

  if (value.erpData !== null && !erpData) {
    return null;
  }

  if (value.crmData !== null && !crmData) {
    return null;
  }

  const reconciliationResult = normalizeReconciliationResult(
    value.reconciliationResult
  );

  if (
    value.reconciliationResult !== null &&
    !reconciliationResult
  ) {
    return null;
  }

  if (!isStringArray(value.reviewedExceptionKeys)) {
    return null;
  }

  const reconciliationHistory =
    value.version === 1
      ? []
      : normalizeHistoryArray(value.reconciliationHistory);

  if (
    value.version !== 1 &&
    reconciliationHistory === null
  ) {
    return null;
  }

  const fieldMappings =
    value.version >= 3
      ? normalizeDatasetFieldMappings(value.fieldMappings)
      : {
          erp: erpData?.fieldMapping ?? { ...DEFAULT_FIELD_MAPPING },
          crm: crmData?.fieldMapping ?? { ...DEFAULT_FIELD_MAPPING },
        };

  if (!fieldMappings) {
    return null;
  }

  const reconciliationRules =
    value.version >= 4
      ? normalizeReconciliationRules(value.reconciliationRules)
      : { ...DEFAULT_RECONCILIATION_RULES };

  if (!reconciliationRules) {
    return null;
  }

  const persistenceMode: WorkspacePersistenceMode =
    value.version >= 6 && value.persistenceMode === 'summary-only'
      ? 'summary-only'
      : 'full';

  return {
    version: WORKSPACE_STORAGE_VERSION,
    savedAt: value.savedAt,
    persistenceMode,
    erpData,
    crmData,
    reconciliationResult,
    reviewedExceptionKeys: value.reviewedExceptionKeys,
    reconciliationHistory: reconciliationHistory ?? [],
    fieldMappings,
    reconciliationRules,
  };
}

function normalizeImportedDataset(
  value: unknown
): ImportedDataset | null {
  if (value === null) {
    return null;
  }

  if (!isObject(value)) {
    return null;
  }

  if (
    typeof value.fileName !== 'string' ||
    typeof value.fileSize !== 'number' ||
    !Array.isArray(value.records) ||
    !isStringArray(value.errors) ||
    !isStringArray(value.warnings) ||
    !Array.isArray(value.issues) ||
    !isObject(value.qualitySummary) ||
    !Array.isArray(value.duplicateIds) ||
    typeof value.totalRows !== 'number' ||
    typeof value.validRows !== 'number' ||
    typeof value.invalidRows !== 'number' ||
    typeof value.cleanRows !== 'number' ||
    typeof value.rowsWithIssues !== 'number' ||
    typeof value.qualityScore !== 'number'
  ) {
    return null;
  }

  const fieldMapping = normalizeFieldMapping(value.fieldMapping) ?? {
    ...DEFAULT_FIELD_MAPPING,
  };

  const headers = isStringArray(value.headers)
    ? value.headers
    : Array.from(new Set(Object.values(fieldMapping)));

  return {
    fileName: value.fileName,
    fileSize: value.fileSize,
    headers,
    fieldMapping,
    records: value.records as ImportedDataset['records'],
    errors: value.errors,
    warnings: value.warnings,
    issues: value.issues as ImportedDataset['issues'],
    qualitySummary:
      value.qualitySummary as unknown as ImportedDataset['qualitySummary'],
    duplicateIds:
      value.duplicateIds as ImportedDataset['duplicateIds'],
    totalRows: value.totalRows,
    validRows: value.validRows,
    invalidRows: value.invalidRows,
    cleanRows: value.cleanRows,
    rowsWithIssues: value.rowsWithIssues,
    qualityScore: value.qualityScore,
    processing: normalizeDatasetProcessingMetrics(
      value.processing,
      value.totalRows
    ),
  };
}

function normalizeReconciliationResult(
  value: unknown
): ReconciliationResult | null {
  if (value === null) {
    return null;
  }

  if (!isObject(value)) {
    return null;
  }

  if (
    !Array.isArray(value.matched) ||
    !Array.isArray(value.differences) ||
    !Array.isArray(value.onlyERP) ||
    !Array.isArray(value.onlyCRM) ||
    typeof value.executedAt !== 'string'
  ) {
    return null;
  }

  const summary = normalizeReconciliationSummary(value.summary);

  if (!summary) {
    return null;
  }

  const matched = value.matched.map((record) =>
    normalizeMatchedRecord(record)
  );

  if (matched.some((record) => record === null)) {
    return null;
  }

  return {
    matched: matched as MatchedRecord[],
    differences: value.differences as ReconciliationResult['differences'],
    onlyERP: value.onlyERP as ReconciliationResult['onlyERP'],
    onlyCRM: value.onlyCRM as ReconciliationResult['onlyCRM'],
    summary,
    executedAt: value.executedAt,
    processing: normalizeReconciliationProcessingMetrics(
      value.processing,
      summary.totalERP + summary.totalCRM
    ),
  };
}

function normalizeHistoryArray(
  value: unknown
): ReconciliationHistoryEntry[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalizedEntries: ReconciliationHistoryEntry[] = [];

  for (const entry of value) {
    const normalizedEntry = normalizeHistoryEntry(entry);

    if (!normalizedEntry) {
      return null;
    }

    normalizedEntries.push(normalizedEntry);
  }

  return normalizedEntries;
}

function normalizeHistoryEntry(
  value: unknown
): ReconciliationHistoryEntry | null {
  if (!isObject(value)) {
    return null;
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.executedAt !== 'string' ||
    typeof value.exceptionCount !== 'number'
  ) {
    return null;
  }

  const erpDataset = normalizeHistoryDatasetSnapshot(value.erpDataset);
  const crmDataset = normalizeHistoryDatasetSnapshot(value.crmDataset);
  const summary = normalizeReconciliationSummary(value.summary);
  const reconciliationRules =
    normalizeReconciliationRules(value.reconciliationRules) ??
    { ...DEFAULT_RECONCILIATION_RULES };

  if (!erpDataset || !crmDataset || !summary) {
    return null;
  }

  return {
    id: value.id,
    executedAt: value.executedAt,
    erpDataset,
    crmDataset,
    summary,
    exceptionCount: value.exceptionCount,
    reconciliationRules,
    processing: normalizeHistoryProcessing(
      value.processing,
      summary.totalERP + summary.totalCRM
    ),
  };
}

function normalizeHistoryDatasetSnapshot(
  value: unknown
): ReconciliationHistoryEntry['erpDataset'] | null {
  if (!isObject(value)) {
    return null;
  }

  if (
    typeof value.fileName !== 'string' ||
    typeof value.fileSize !== 'number' ||
    typeof value.totalRows !== 'number' ||
    typeof value.cleanRows !== 'number' ||
    typeof value.rowsWithIssues !== 'number' ||
    typeof value.qualityScore !== 'number' ||
    typeof value.blockingIssues !== 'number' ||
    typeof value.warnings !== 'number' ||
    typeof value.duplicateIds !== 'number'
  ) {
    return null;
  }

  return {
    fileName: value.fileName,
    fileSize: value.fileSize,
    totalRows: value.totalRows,
    cleanRows: value.cleanRows,
    rowsWithIssues: value.rowsWithIssues,
    qualityScore: value.qualityScore,
    blockingIssues: value.blockingIssues,
    warnings: value.warnings,
    duplicateIds: value.duplicateIds,
    fieldMapping:
      normalizeFieldMapping(value.fieldMapping) ?? {
        ...DEFAULT_FIELD_MAPPING,
      },
    processing: normalizeDatasetProcessingMetrics(
      value.processing,
      value.totalRows
    ),
  };
}

function normalizeDatasetFieldMappings(
  value: unknown
): DatasetFieldMappings | null {
  if (!isObject(value)) {
    return null;
  }

  const erp = normalizeFieldMapping(value.erp);
  const crm = normalizeFieldMapping(value.crm);

  if (!erp || !crm) {
    return null;
  }

  return { erp, crm };
}

function normalizeFieldMapping(
  value: unknown
): FieldMapping | null {
  if (!isObject(value)) {
    return null;
  }

  if (
    typeof value.id !== 'string' ||
    typeof value.cliente !== 'string' ||
    typeof value.monto !== 'string' ||
    typeof value.estado !== 'string'
  ) {
    return null;
  }

  return {
    id: value.id,
    cliente: value.cliente,
    monto: value.monto,
    estado: value.estado,
  };
}

function areDatasetFieldMappingsDefault(
  mappings: DatasetFieldMappings
): boolean {
  return (
    areFieldMappingsEqual(mappings.erp, DEFAULT_FIELD_MAPPING) &&
    areFieldMappingsEqual(mappings.crm, DEFAULT_FIELD_MAPPING)
  );
}

function areFieldMappingsEqual(
  first: FieldMapping,
  second: FieldMapping
): boolean {
  return (
    first.id === second.id &&
    first.cliente === second.cliente &&
    first.monto === second.monto &&
    first.estado === second.estado
  );
}

function safelyRemoveWorkspace() {
  try {
    window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
  } catch {
    // If storage itself is unavailable, there is nothing else to recover here.
  }
}

function canUseLocalStorage(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.localStorage !== 'undefined'
  );
}

function getPersistenceErrorMessage(error: unknown): string {
  if (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  ) {
    return 'Browser storage is full. The current workspace is still available in memory, but it could not be persisted.';
  }

  return 'The workspace could not be saved to browser storage. Current data remains available in memory.';
}

function normalizeReconciliationSummary(
  value: unknown
): ReconciliationSummary | null {
  if (!isObject(value)) {
    return null;
  }

  if (
    typeof value.totalERP !== 'number' ||
    typeof value.totalCRM !== 'number' ||
    typeof value.totalUnique !== 'number' ||
    typeof value.matched !== 'number' ||
    typeof value.exactMatched !== 'number' ||
    typeof value.normalizedMatched !== 'number' ||
    typeof value.differences !== 'number' ||
    typeof value.onlyERP !== 'number' ||
    typeof value.onlyCRM !== 'number' ||
    typeof value.matchRate !== 'number'
  ) {
    return null;
  }

  return {
    totalERP: value.totalERP,
    totalCRM: value.totalCRM,
    totalUnique: value.totalUnique,
    matched: value.matched,
    exactMatched: value.exactMatched,
    normalizedMatched: value.normalizedMatched,
    toleranceMatched:
      typeof value.toleranceMatched === 'number'
        ? value.toleranceMatched
        : 0,
    differences: value.differences,
    onlyERP: value.onlyERP,
    onlyCRM: value.onlyCRM,
    matchRate: value.matchRate,
  };
}

function normalizeMatchedRecord(
  value: unknown
): MatchedRecord | null {
  if (!isObject(value)) {
    return null;
  }

  if (
    typeof value.id !== 'string' ||
    !isObject(value.erpRecord) ||
    !isObject(value.crmRecord) ||
    (value.matchType !== 'Exact Match' &&
      value.matchType !== 'Normalized Match' &&
      value.matchType !== 'Tolerance Match') ||
    !isStringArray(value.normalizedFields)
  ) {
    return null;
  }

  const toleranceFields = isStringArray(value.toleranceFields)
    ? value.toleranceFields
    : [];

  return {
    id: value.id,
    erpRecord: value.erpRecord as unknown as MatchedRecord['erpRecord'],
    crmRecord: value.crmRecord as unknown as MatchedRecord['crmRecord'],
    matchType: value.matchType,
    normalizedFields:
      value.normalizedFields as MatchedRecord['normalizedFields'],
    toleranceFields:
      toleranceFields as MatchedRecord['toleranceFields'],
  };
}

function normalizeReconciliationRules(
  value: unknown
): ReconciliationRules | null {
  if (!isObject(value)) {
    return null;
  }

  if (
    typeof value.normalizeCustomerNames !== 'boolean' ||
    typeof value.normalizeStatuses !== 'boolean' ||
    typeof value.amountToleranceEnabled !== 'boolean' ||
    typeof value.amountTolerance !== 'number' ||
    !Number.isFinite(value.amountTolerance) ||
    value.amountTolerance < 0
  ) {
    return null;
  }

  return {
    normalizeCustomerNames: value.normalizeCustomerNames,
    normalizeStatuses: value.normalizeStatuses,
    amountToleranceEnabled: value.amountToleranceEnabled,
    amountTolerance: value.amountTolerance,
  };
}

function areReconciliationRulesDefault(
  rules: ReconciliationRules
): boolean {
  return (
    rules.normalizeCustomerNames ===
      DEFAULT_RECONCILIATION_RULES.normalizeCustomerNames &&
    rules.normalizeStatuses ===
      DEFAULT_RECONCILIATION_RULES.normalizeStatuses &&
    rules.amountToleranceEnabled ===
      DEFAULT_RECONCILIATION_RULES.amountToleranceEnabled &&
    rules.amountTolerance ===
      DEFAULT_RECONCILIATION_RULES.amountTolerance
  );
}

export function getWorkspaceStorageMetrics(): WorkspaceStorageMetrics {
  if (!canUseLocalStorage()) {
    return createUnavailableStorageMetrics();
  }

  try {
    const rawValue = window.localStorage.getItem(
      WORKSPACE_STORAGE_KEY
    );

    return createWorkspaceStorageMetrics(
      rawValue ? getTextByteLength(rawValue) : 0
    );
  } catch {
    return createUnavailableStorageMetrics();
  }
}

function normalizeDatasetProcessingMetrics(
  value: unknown,
  rowsProcessed: number
): DatasetProcessingMetrics {
  if (
    isObject(value) &&
    typeof value.csvParseMs === 'number' &&
    typeof value.validationMs === 'number' &&
    typeof value.totalImportMs === 'number' &&
    typeof value.rowsProcessed === 'number' &&
    typeof value.rowsPerSecond === 'number' &&
    (value.workloadTier === 'Small' ||
      value.workloadTier === 'Medium' ||
      value.workloadTier === 'Large')
  ) {
    return {
      csvParseMs: value.csvParseMs,
      validationMs: value.validationMs,
      totalImportMs: value.totalImportMs,
      rowsProcessed: value.rowsProcessed,
      rowsPerSecond: value.rowsPerSecond,
      workloadTier: value.workloadTier,
    };
  }

  return createDatasetProcessingMetrics(
    0,
    0,
    rowsProcessed
  );
}

function normalizeReconciliationProcessingMetrics(
  value: unknown,
  totalRowsProcessed: number
): ReconciliationProcessingMetrics {
  if (
    isObject(value) &&
    typeof value.durationMs === 'number' &&
    typeof value.totalRowsProcessed === 'number' &&
    typeof value.throughputRowsPerSecond === 'number' &&
    (value.workloadTier === 'Small' ||
      value.workloadTier === 'Medium' ||
      value.workloadTier === 'Large')
  ) {
    return {
      durationMs: value.durationMs,
      totalRowsProcessed: value.totalRowsProcessed,
      throughputRowsPerSecond: value.throughputRowsPerSecond,
      workloadTier: value.workloadTier,
    };
  }

  return createReconciliationProcessingMetrics(
    0,
    totalRowsProcessed
  );
}

function normalizeHistoryProcessing(
  value: unknown,
  totalRowsProcessed: number
): ReconciliationHistoryEntry['processing'] {
  if (isObject(value)) {
    const reconciliation =
      normalizeReconciliationProcessingMetrics(
        value.reconciliation,
        totalRowsProcessed
      );

    return {
      reconciliation,
      observedPipelineMs:
        typeof value.observedPipelineMs === 'number' &&
        Number.isFinite(value.observedPipelineMs) &&
        value.observedPipelineMs >= 0
          ? value.observedPipelineMs
          : reconciliation.durationMs,
    };
  }

  const reconciliation =
    createReconciliationProcessingMetrics(
      0,
      totalRowsProcessed
    );

  return {
    reconciliation,
    observedPipelineMs: reconciliation.durationMs,
  };
}

function createWorkspaceStorageMetrics(
  usedBytes: number
): WorkspaceStorageMetrics {
  const safeUsedBytes = Math.max(0, usedBytes);
  const ratio =
    WORKSPACE_STORAGE_REFERENCE_BYTES === 0
      ? 0
      : safeUsedBytes / WORKSPACE_STORAGE_REFERENCE_BYTES;

  const status: WorkspaceStorageMetrics['status'] =
    ratio >= WORKSPACE_STORAGE_HIGH_RATIO
      ? 'High'
      : ratio >= WORKSPACE_STORAGE_WARNING_RATIO
        ? 'Approaching Limit'
        : 'Normal';

  return {
    usedBytes: safeUsedBytes,
    usedMegabytes:
      Math.round((safeUsedBytes / (1024 * 1024)) * 100) /
      100,
    referenceLimitBytes: WORKSPACE_STORAGE_REFERENCE_BYTES,
    percentOfReferenceLimit:
      Math.round(ratio * 1000) / 10,
    status,
  };
}

function createUnavailableStorageMetrics(): WorkspaceStorageMetrics {
  return {
    usedBytes: 0,
    usedMegabytes: 0,
    referenceLimitBytes: WORKSPACE_STORAGE_REFERENCE_BYTES,
    percentOfReferenceLimit: 0,
    status: 'Unavailable',
  };
}

function getTextByteLength(value: string): number {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(value).byteLength;
  }

  return value.length * 2;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === 'string')
  );
}

function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}
