import {
  WORKSPACE_STORAGE_KEY,
  WORKSPACE_STORAGE_VERSION,
} from '../config/storageConfig';

import {
  DEFAULT_FIELD_MAPPING,
} from '../config/fieldMappingConfig';

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
  ReconciliationResult,
  ReconciliationSummary,
} from '../types/ReconciliationResult';

export interface PersistedWorkspace {
  version: typeof WORKSPACE_STORAGE_VERSION;
  savedAt: string;
  erpData: ImportedDataset | null;
  crmData: ImportedDataset | null;
  reconciliationResult: ReconciliationResult | null;
  reviewedExceptionKeys: string[];
  reconciliationHistory: ReconciliationHistoryEntry[];
  fieldMappings: DatasetFieldMappings;
}

export interface WorkspacePersistenceResult {
  success: boolean;
  savedAt: string | null;
  error: string | null;
}

interface WorkspaceStateToPersist {
  erpData: ImportedDataset | null;
  crmData: ImportedDataset | null;
  reconciliationResult: ReconciliationResult | null;
  reviewedExceptionKeys: string[];
  reconciliationHistory: ReconciliationHistoryEntry[];
  fieldMappings: DatasetFieldMappings;
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
    };
  }

  const hasPersistableData = Boolean(
    state.erpData ||
      state.crmData ||
      state.reconciliationResult ||
      state.reviewedExceptionKeys.length > 0 ||
      state.reconciliationHistory.length > 0 ||
      !areDatasetFieldMappingsDefault(state.fieldMappings)
  );

  if (!hasPersistableData) {
    try {
      window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);

      return {
        success: true,
        savedAt: null,
        error: null,
      };
    } catch {
      return {
        success: false,
        savedAt: null,
        error:
          'The empty workspace could not be synchronized with browser storage.',
      };
    }
  }

  const savedAt = new Date().toISOString();

  const workspace: PersistedWorkspace = {
    version: WORKSPACE_STORAGE_VERSION,
    savedAt,
    erpData: state.erpData,
    crmData: state.crmData,
    reconciliationResult: state.reconciliationResult,
    reviewedExceptionKeys: state.reviewedExceptionKeys,
    reconciliationHistory: state.reconciliationHistory,
    fieldMappings: state.fieldMappings,
  };

  try {
    window.localStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify(workspace)
    );

    return {
      success: true,
      savedAt,
      error: null,
    };
  } catch (error: unknown) {
    return {
      success: false,
      savedAt: null,
      error: getPersistenceErrorMessage(error),
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
    value.version === WORKSPACE_STORAGE_VERSION
      ? normalizeDatasetFieldMappings(value.fieldMappings)
      : {
          erp: erpData?.fieldMapping ?? { ...DEFAULT_FIELD_MAPPING },
          crm: crmData?.fieldMapping ?? { ...DEFAULT_FIELD_MAPPING },
        };

  if (!fieldMappings) {
    return null;
  }

  return {
    version: WORKSPACE_STORAGE_VERSION,
    savedAt: value.savedAt,
    erpData,
    crmData,
    reconciliationResult,
    reviewedExceptionKeys: value.reviewedExceptionKeys,
    reconciliationHistory: reconciliationHistory ?? [],
    fieldMappings,
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
    !isReconciliationSummary(value.summary) ||
    typeof value.executedAt !== 'string'
  ) {
    return null;
  }

  return value as unknown as ReconciliationResult;
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
    !isReconciliationSummary(value.summary) ||
    typeof value.exceptionCount !== 'number'
  ) {
    return null;
  }

  const erpDataset = normalizeHistoryDatasetSnapshot(value.erpDataset);
  const crmDataset = normalizeHistoryDatasetSnapshot(value.crmDataset);

  if (!erpDataset || !crmDataset) {
    return null;
  }

  return {
    id: value.id,
    executedAt: value.executedAt,
    erpDataset,
    crmDataset,
    summary: value.summary,
    exceptionCount: value.exceptionCount,
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

function isReconciliationSummary(
  value: unknown
): value is ReconciliationSummary {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.totalERP === 'number' &&
    typeof value.totalCRM === 'number' &&
    typeof value.totalUnique === 'number' &&
    typeof value.matched === 'number' &&
    typeof value.exactMatched === 'number' &&
    typeof value.normalizedMatched === 'number' &&
    typeof value.differences === 'number' &&
    typeof value.onlyERP === 'number' &&
    typeof value.onlyCRM === 'number' &&
    typeof value.matchRate === 'number'
  );
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
