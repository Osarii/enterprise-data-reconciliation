import { describe, expect, it } from 'vitest';

import { DEFAULT_FIELD_MAPPING } from '../src/config/fieldMappingConfig';
import { DEFAULT_RECONCILIATION_RULES } from '../src/config/reconciliationRulesConfig';
import type { ImportedDataset } from '../src/types/ImportedDataset';
import type { ReconciliationRecord } from '../src/types/ReconciliationRecord';
import {
  calculateAverageHistoryMatchRate,
  calculateAverageHistoryQuality,
  calculateBestHistoryMatchRate,
  createReconciliationHistoryEntry,
  getHistoryEntryAverageQuality,
} from '../src/utils/reconciliationHistory';
import { reconcileData } from '../src/utils/reconcileData';

function createDataset(
  fileName: string,
  records: ReconciliationRecord[],
  qualityScore = 100
): ImportedDataset {
  return {
    fileName,
    fileSize: 1024,
    headers: ['id', 'cliente', 'monto', 'estado'],
    fieldMapping: { ...DEFAULT_FIELD_MAPPING },
    records,
    errors: [],
    warnings: [],
    issues: [],
    qualitySummary: {
      score: qualityScore,
      blockingIssues: 0,
      warnings: 0,
      duplicateIds: 0,
      invalidValues: 0,
      suspiciousIds: 0,
      cleanRows: records.length,
      rowsWithIssues: 0,
      blockingRows: 0,
      warningRows: 0,
      issueBreakdown: [],
    },
    duplicateIds: [],
    totalRows: records.length,
    validRows: records.length,
    invalidRows: 0,
    cleanRows: records.length,
    rowsWithIssues: 0,
    qualityScore,
    processing: {
      csvParseMs: 5,
      validationMs: 5,
      totalImportMs: 10,
      rowsProcessed: records.length,
      rowsPerSecond: records.length * 100,
      workloadTier: 'Small',
    },
  };
}

describe('reconciliationHistory', () => {
  const erpRecords: ReconciliationRecord[] = [
    { id: 'A', cliente: 'Alpha', monto: 100, estado: 'Activo' },
    { id: 'B', cliente: 'Beta', monto: 200, estado: 'Activo' },
  ];

  const crmRecords: ReconciliationRecord[] = [
    { id: 'A', cliente: 'Alpha', monto: 100, estado: 'Activo' },
    { id: 'C', cliente: 'Gamma', monto: 300, estado: 'Activo' },
  ];

  it('creates a compact historical snapshot with exceptions and rules', () => {
    const erp = createDataset('erp.csv', erpRecords, 98);
    const crm = createDataset('crm.csv', crmRecords, 94);
    const result = reconcileData(
      erp.records,
      crm.records,
      DEFAULT_RECONCILIATION_RULES
    );

    const entry = createReconciliationHistoryEntry(
      result,
      erp,
      crm,
      DEFAULT_RECONCILIATION_RULES
    );

    expect(entry.id).toContain('reconciliation-');
    expect(entry.erpDataset.fileName).toBe('erp.csv');
    expect(entry.crmDataset.fileName).toBe('crm.csv');
    expect(entry.exceptionCount).toBe(2);
    expect(entry.erpDataset).not.toHaveProperty('records');
    expect(entry.reconciliationRules).toEqual(
      DEFAULT_RECONCILIATION_RULES
    );
    expect(getHistoryEntryAverageQuality(entry)).toBe(96);
  });

  it('calculates aggregate historical metrics', () => {
    const erp = createDataset('erp.csv', erpRecords, 100);
    const crm = createDataset('crm.csv', crmRecords, 100);

    const first = createReconciliationHistoryEntry(
      reconcileData(erp.records, crm.records),
      erp,
      crm,
      DEFAULT_RECONCILIATION_RULES
    );

    const second = {
      ...first,
      id: 'second',
      summary: {
        ...first.summary,
        matchRate: 100,
      },
      erpDataset: {
        ...first.erpDataset,
        qualityScore: 90,
      },
      crmDataset: {
        ...first.crmDataset,
        qualityScore: 80,
      },
    };

    expect(calculateAverageHistoryMatchRate([first, second])).toBeCloseTo(
      (first.summary.matchRate + 100) / 2
    );
    expect(calculateBestHistoryMatchRate([first, second])).toBe(100);
    expect(calculateAverageHistoryQuality([first, second])).toBe(92.5);
  });

  it('returns zero for empty historical metrics', () => {
    expect(calculateAverageHistoryMatchRate([])).toBe(0);
    expect(calculateBestHistoryMatchRate([])).toBe(0);
    expect(calculateAverageHistoryQuality([])).toBe(0);
  });
});
