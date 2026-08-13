import { beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_FIELD_MAPPING } from '../src/config/fieldMappingConfig';
import { FULL_WORKSPACE_PERSISTENCE_MAX_ROWS } from '../src/config/performanceConfig';
import { DEFAULT_RECONCILIATION_RULES } from '../src/config/reconciliationRulesConfig';
import {
  WORKSPACE_STORAGE_KEY,
  WORKSPACE_STORAGE_VERSION,
} from '../src/config/storageConfig';
import type { ImportedDataset } from '../src/types/ImportedDataset';
import type { ReconciliationRecord } from '../src/types/ReconciliationRecord';
import {
  clearPersistedWorkspace,
  loadWorkspace,
  saveWorkspace,
} from '../src/utils/workspacePersistence';

function createDataset(fileName: string, rowCount: number): ImportedDataset {
  const records: ReconciliationRecord[] = Array.from(
    { length: rowCount },
    (_, index) => ({
      id: `ID-${index + 1}`,
      cliente: `Customer ${index + 1}`,
      monto: index + 1,
      estado: 'Activo',
    })
  );

  return {
    fileName,
    fileSize: rowCount * 50,
    headers: ['id', 'cliente', 'monto', 'estado'],
    fieldMapping: { ...DEFAULT_FIELD_MAPPING },
    records,
    errors: [],
    warnings: [],
    issues: [],
    qualitySummary: {
      score: 100,
      blockingIssues: 0,
      warnings: 0,
      duplicateIds: 0,
      invalidValues: 0,
      suspiciousIds: 0,
      cleanRows: rowCount,
      rowsWithIssues: 0,
      blockingRows: 0,
      warningRows: 0,
      issueBreakdown: [],
    },
    duplicateIds: [],
    totalRows: rowCount,
    validRows: rowCount,
    invalidRows: 0,
    cleanRows: rowCount,
    rowsWithIssues: 0,
    qualityScore: 100,
    processing: {
      csvParseMs: 1,
      validationMs: 1,
      totalImportMs: 2,
      rowsProcessed: rowCount,
      rowsPerSecond: rowCount * 500,
      workloadTier:
        rowCount <= 5_000
          ? 'Small'
          : rowCount <= 20_000
            ? 'Medium'
            : 'Large',
    },
  };
}

function createState(
  erpData: ImportedDataset | null,
  crmData: ImportedDataset | null
) {
  return {
    erpData,
    crmData,
    reconciliationResult: null,
    reviewedExceptionKeys: [],
    reconciliationHistory: [],
    fieldMappings: {
      erp: { ...DEFAULT_FIELD_MAPPING },
      crm: { ...DEFAULT_FIELD_MAPPING },
    },
    reconciliationRules: { ...DEFAULT_RECONCILIATION_RULES },
  };
}

describe('workspacePersistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('saves and restores a normal workspace in full mode', () => {
    const erp = createDataset('erp.csv', 2);
    const crm = createDataset('crm.csv', 2);

    const saved = saveWorkspace(createState(erp, crm));

    expect(saved.success).toBe(true);
    expect(saved.mode).toBe('full');

    const restored = loadWorkspace();

    expect(restored?.version).toBe(WORKSPACE_STORAGE_VERSION);
    expect(restored?.persistenceMode).toBe('full');
    expect(restored?.erpData?.fileName).toBe('erp.csv');
    expect(restored?.crmData?.records).toHaveLength(2);
  });

  it('switches large workspaces to summary-only persistence', () => {
    const rowsPerDataset =
      Math.floor(FULL_WORKSPACE_PERSISTENCE_MAX_ROWS / 2) + 1;

    const saved = saveWorkspace(
      createState(
        createDataset('large-erp.csv', rowsPerDataset),
        createDataset('large-crm.csv', rowsPerDataset)
      )
    );

    expect(saved.success).toBe(true);
    expect(saved.mode).toBe('summary-only');

    const restored = loadWorkspace();

    expect(restored?.persistenceMode).toBe('summary-only');
    expect(restored?.erpData).toBeNull();
    expect(restored?.crmData).toBeNull();
  });

  it('migrates a version 5 workspace to the current storage version', () => {
    window.localStorage.setItem(
      WORKSPACE_STORAGE_KEY,
      JSON.stringify({
        version: 5,
        savedAt: '2026-08-13T00:00:00.000Z',
        erpData: null,
        crmData: null,
        reconciliationResult: null,
        reviewedExceptionKeys: [],
        reconciliationHistory: [],
        fieldMappings: {
          erp: { ...DEFAULT_FIELD_MAPPING },
          crm: { ...DEFAULT_FIELD_MAPPING },
        },
        reconciliationRules: { ...DEFAULT_RECONCILIATION_RULES },
      })
    );

    const restored = loadWorkspace();

    expect(restored?.version).toBe(WORKSPACE_STORAGE_VERSION);
    expect(restored?.persistenceMode).toBe('full');
  });

  it('clears persisted workspace data', () => {
    saveWorkspace(createState(createDataset('erp.csv', 1), null));

    expect(window.localStorage.getItem(WORKSPACE_STORAGE_KEY)).not.toBeNull();
    expect(clearPersistedWorkspace()).toBe(true);
    expect(window.localStorage.getItem(WORKSPACE_STORAGE_KEY)).toBeNull();
  });
});
