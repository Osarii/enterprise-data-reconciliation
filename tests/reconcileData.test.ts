import { describe, expect, it } from 'vitest';

import { DEFAULT_RECONCILIATION_RULES } from '../src/config/reconciliationRulesConfig';
import type { ReconciliationRecord } from '../src/types/ReconciliationRecord';
import { reconcileData } from '../src/utils/reconcileData';

const erpRecords: ReconciliationRecord[] = [
  {
    id: 'RULE-100',
    cliente: 'Alpha Tech',
    monto: 1000,
    estado: 'Activo',
  },
  {
    id: 'RULE-101',
    cliente: 'Café Norte',
    monto: 2000,
    estado: 'Pendiente',
  },
  {
    id: 'RULE-102',
    cliente: 'Beta Logistics',
    monto: 5000,
    estado: 'Activo',
  },
  {
    id: 'RULE-103',
    cliente: 'Gamma Health',
    monto: 10000,
    estado: 'Inactivo',
  },
  {
    id: 'RULE-104',
    cliente: 'Only ERP',
    monto: 1500,
    estado: 'Activo',
  },
];

const crmRecords: ReconciliationRecord[] = [
  {
    id: 'RULE-100',
    cliente: 'Alpha Tech',
    monto: 1000,
    estado: 'Activo',
  },
  {
    id: 'RULE-101',
    cliente: 'CAFE NORTE',
    monto: 2000,
    estado: 'pendiente',
  },
  {
    id: 'RULE-102',
    cliente: 'Beta Logistics',
    monto: 5003,
    estado: 'Activo',
  },
  {
    id: 'RULE-103',
    cliente: 'Gamma Health',
    monto: 10020,
    estado: 'Inactivo',
  },
  {
    id: 'RULE-105',
    cliente: 'Only CRM',
    monto: 1700,
    estado: 'Activo',
  },
];

describe('reconcileData regression suite', () => {
  it('produces the expected strict reconciliation result', () => {
    const result = reconcileData(
      erpRecords,
      crmRecords,
      DEFAULT_RECONCILIATION_RULES
    );

    expect(result.summary.totalUnique).toBe(6);
    expect(result.summary.matched).toBe(2);
    expect(result.summary.exactMatched).toBe(1);
    expect(result.summary.normalizedMatched).toBe(1);
    expect(result.summary.toleranceMatched).toBe(0);
    expect(result.summary.differences).toBe(2);
    expect(result.summary.onlyERP).toBe(1);
    expect(result.summary.onlyCRM).toBe(1);
    expect(result.summary.matchRate).toBeCloseTo(33.3333, 3);

    expect(
      result.matched.find((record) => record.id === 'RULE-101')?.matchType
    ).toBe('Normalized Match');
  });

  it('converts a difference into a Tolerance Match with ±5 enabled', () => {
    const result = reconcileData(erpRecords, crmRecords, {
      ...DEFAULT_RECONCILIATION_RULES,
      amountToleranceEnabled: true,
      amountTolerance: 5,
    });

    expect(result.summary.totalUnique).toBe(6);
    expect(result.summary.matched).toBe(3);
    expect(result.summary.exactMatched).toBe(1);
    expect(result.summary.normalizedMatched).toBe(1);
    expect(result.summary.toleranceMatched).toBe(1);
    expect(result.summary.differences).toBe(1);
    expect(result.summary.onlyERP).toBe(1);
    expect(result.summary.onlyCRM).toBe(1);
    expect(result.summary.matchRate).toBe(50);

    const toleranceMatch = result.matched.find(
      (record) => record.id === 'RULE-102'
    );

    expect(toleranceMatch?.matchType).toBe('Tolerance Match');
    expect(toleranceMatch?.toleranceFields).toEqual(['monto']);

    expect(
      result.differences.find((record) => record.id === 'RULE-103')
    ).toBeDefined();
  });

  it('turns normalized matches into real differences when normalization is disabled', () => {
    const result = reconcileData(erpRecords, crmRecords, {
      ...DEFAULT_RECONCILIATION_RULES,
      normalizeCustomerNames: false,
      normalizeStatuses: false,
    });

    expect(result.summary.matched).toBe(1);
    expect(result.summary.normalizedMatched).toBe(0);
    expect(result.summary.differences).toBe(3);
  });

  it('keeps IDs as exact reconciliation keys', () => {
    const result = reconcileData(
      [{ ...erpRecords[0], id: 'RULE-100' }],
      [{ ...crmRecords[0], id: 'rule-100' }],
      DEFAULT_RECONCILIATION_RULES
    );

    expect(result.summary.matched).toBe(0);
    expect(result.summary.onlyERP).toBe(1);
    expect(result.summary.onlyCRM).toBe(1);
  });

  it('emits processing metrics for each reconciliation', () => {
    const result = reconcileData(
      erpRecords,
      crmRecords,
      DEFAULT_RECONCILIATION_RULES
    );

    expect(result.processing.totalRowsProcessed).toBe(10);
    expect(result.processing.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.processing.workloadTier).toBe('Small');
  });
});
