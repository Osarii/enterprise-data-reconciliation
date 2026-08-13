import { describe, expect, it } from 'vitest';

import type { DataQualityIssue } from '../src/types/CsvValidation';

import {
  buildDataQualitySummary,
  createSuspiciousIdIssue,
  getBlockingIssues,
  getCanonicalStatus,
  getWarningIssues,
  hasBlockingIssues,
  isAllowedStatus,
} from '../src/utils/dataQuality';

describe('dataQuality', () => {
  it('recognizes configured statuses after normalization', () => {
    expect(isAllowedStatus('ACTIVO')).toBe(true);
    expect(isAllowedStatus('  pendiente ')).toBe(true);
    expect(getCanonicalStatus('inACTIVO')).toBe('Inactivo');
    expect(isAllowedStatus('Cancelado')).toBe(false);
  });

  it('accepts common enterprise identifier formats', () => {
    expect(createSuspiciousIdIssue('CUS-10025', 2)).toBeNull();
    expect(createSuspiciousIdIssue('CR-2026-001', 2)).toBeNull();
    expect(createSuspiciousIdIssue('ACC_0054', 2)).toBeNull();
  });

  it('flags suspicious identifiers as warnings instead of blocking errors', () => {
    const shortIssue = createSuspiciousIdIssue('A1', 8);
    const unusualIssue = createSuspiciousIdIssue('ERR#008', 9);
    const whitespaceIssue = createSuspiciousIdIssue(' CRM-01 ', 10);

    expect(shortIssue?.severity).toBe('WARNING');
    expect(shortIssue?.type).toBe('Suspicious ID');
    expect(shortIssue?.row).toBe(8);

    expect(unusualIssue?.message).toContain('unusual characters');
    expect(whitespaceIssue?.message).toContain(
      'leading or trailing whitespace'
    );
  });

  it('separates blocking issues from warnings', () => {
    const issues: DataQualityIssue[] = [
      {
        type: 'Duplicate ID',
        severity: 'BLOCKING',
        message: 'Duplicate',
      },
      {
        type: 'Suspicious ID',
        severity: 'WARNING',
        message: 'Suspicious',
      },
    ];

    expect(hasBlockingIssues(issues)).toBe(true);
    expect(getBlockingIssues(issues)).toHaveLength(1);
    expect(getWarningIssues(issues)).toHaveLength(1);
  });

  it('calculates the application-defined Data Quality Score V2 consistently', () => {
    const issues: DataQualityIssue[] = [
      {
        type: 'Invalid Amount',
        severity: 'BLOCKING',
        message: 'Invalid amount',
        row: 2,
        field: 'monto',
      },
      {
        type: 'Suspicious ID',
        severity: 'WARNING',
        message: 'Suspicious id',
        row: 3,
        field: 'id',
      },
      {
        type: 'Duplicate ID',
        severity: 'BLOCKING',
        message: 'Duplicate',
        field: 'id',
        relatedRows: [4, 5],
      },
      {
        type: 'Unexpected Column',
        severity: 'WARNING',
        message: 'Unexpected column',
        field: 'header',
      },
    ];

    const summary = buildDataQualitySummary({
      issues,
      totalRows: 10,
      issueRows: new Set([2, 3, 4, 5]),
      blockingRows: new Set([2, 4, 5]),
      warningRows: new Set([3]),
      duplicateRows: new Set([4, 5]),
    });

    expect(summary.score).toBe(75.5);
    expect(summary.blockingIssues).toBe(2);
    expect(summary.warnings).toBe(2);
    expect(summary.duplicateIds).toBe(1);
    expect(summary.invalidValues).toBe(1);
    expect(summary.suspiciousIds).toBe(1);
    expect(summary.cleanRows).toBe(6);
    expect(summary.rowsWithIssues).toBe(4);
    expect(summary.issueBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'Duplicate ID',
          count: 1,
          blockingCount: 1,
        }),
      ])
    );
  });

  it('returns zero quality for an empty dataset', () => {
    const summary = buildDataQualitySummary({
      issues: [],
      totalRows: 0,
      issueRows: new Set(),
      blockingRows: new Set(),
      warningRows: new Set(),
      duplicateRows: new Set(),
    });

    expect(summary.score).toBe(0);
  });
});
