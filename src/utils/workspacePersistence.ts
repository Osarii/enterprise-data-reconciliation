import {
  WORKSPACE_STORAGE_KEY,
  WORKSPACE_STORAGE_VERSION,
} from '../config/storageConfig';

import type {
  ImportedDataset,
} from '../types/ImportedDataset';

import type {
  ReconciliationResult,
} from '../types/ReconciliationResult';

export interface PersistedWorkspace {
  version: typeof WORKSPACE_STORAGE_VERSION;
  savedAt: string;
  erpData: ImportedDataset | null;
  crmData: ImportedDataset | null;
  reconciliationResult: ReconciliationResult | null;
  reviewedExceptionKeys: string[];
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

    if (!isPersistedWorkspace(parsedValue)) {
      window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      return null;
    }

    return parsedValue;
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
      state.reviewedExceptionKeys.length > 0
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

function isPersistedWorkspace(
  value: unknown
): value is PersistedWorkspace {
  if (!isObject(value)) {
    return false;
  }

  return (
    value.version === WORKSPACE_STORAGE_VERSION &&
    typeof value.savedAt === 'string' &&
    isImportedDatasetOrNull(value.erpData) &&
    isImportedDatasetOrNull(value.crmData) &&
    isReconciliationResultOrNull(value.reconciliationResult) &&
    isStringArray(value.reviewedExceptionKeys)
  );
}

function isImportedDatasetOrNull(
  value: unknown
): value is ImportedDataset | null {
  return value === null || isImportedDataset(value);
}

function isImportedDataset(
  value: unknown
): value is ImportedDataset {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.fileName === 'string' &&
    typeof value.fileSize === 'number' &&
    Array.isArray(value.records) &&
    isStringArray(value.errors) &&
    isStringArray(value.warnings) &&
    Array.isArray(value.issues) &&
    isObject(value.qualitySummary) &&
    Array.isArray(value.duplicateIds) &&
    typeof value.totalRows === 'number' &&
    typeof value.validRows === 'number' &&
    typeof value.invalidRows === 'number' &&
    typeof value.cleanRows === 'number' &&
    typeof value.rowsWithIssues === 'number' &&
    typeof value.qualityScore === 'number'
  );
}

function isReconciliationResultOrNull(
  value: unknown
): value is ReconciliationResult | null {
  return value === null || isReconciliationResult(value);
}

function isReconciliationResult(
  value: unknown
): value is ReconciliationResult {
  if (!isObject(value)) {
    return false;
  }

  return (
    Array.isArray(value.matched) &&
    Array.isArray(value.differences) &&
    Array.isArray(value.onlyERP) &&
    Array.isArray(value.onlyCRM) &&
    isObject(value.summary) &&
    typeof value.executedAt === 'string'
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
