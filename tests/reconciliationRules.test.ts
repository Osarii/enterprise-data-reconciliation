import { describe, expect, it } from 'vitest';

import {
  DEFAULT_RECONCILIATION_RULES,
  MAX_ABSOLUTE_AMOUNT_TOLERANCE,
} from '../src/config/reconciliationRulesConfig';

import {
  areReconciliationRulesDefault,
  isAmountWithinTolerance,
  sanitizeReconciliationRules,
} from '../src/utils/reconciliationRules';

describe('reconciliationRules', () => {
  it('sanitizes invalid or unsafe tolerance values', () => {
    expect(
      sanitizeReconciliationRules({
        normalizeCustomerNames: true,
        normalizeStatuses: true,
        amountToleranceEnabled: true,
        amountTolerance: -20,
      }).amountTolerance
    ).toBe(0);

    expect(
      sanitizeReconciliationRules({
        normalizeCustomerNames: true,
        normalizeStatuses: true,
        amountToleranceEnabled: true,
        amountTolerance: Number.NaN,
      }).amountTolerance
    ).toBe(0);

    expect(
      sanitizeReconciliationRules({
        normalizeCustomerNames: true,
        normalizeStatuses: true,
        amountToleranceEnabled: true,
        amountTolerance: MAX_ABSOLUTE_AMOUNT_TOLERANCE + 1,
      }).amountTolerance
    ).toBe(MAX_ABSOLUTE_AMOUNT_TOLERANCE);
  });

  it('accepts amounts exactly on the configured tolerance boundary', () => {
    const rules = {
      ...DEFAULT_RECONCILIATION_RULES,
      amountToleranceEnabled: true,
      amountTolerance: 5,
    };

    expect(isAmountWithinTolerance(5000, 5005, rules)).toBe(true);
    expect(isAmountWithinTolerance(5000, 5005.01, rules)).toBe(false);
  });

  it('does not apply tolerance when the rule is disabled', () => {
    expect(
      isAmountWithinTolerance(5000, 5001, DEFAULT_RECONCILIATION_RULES)
    ).toBe(false);
  });

  it('rejects non-numeric values from amount tolerance matching', () => {
    const rules = {
      ...DEFAULT_RECONCILIATION_RULES,
      amountToleranceEnabled: true,
      amountTolerance: 10,
    };

    expect(isAmountWithinTolerance('abc', 10, rules)).toBe(false);
  });

  it('recognizes the default reconciliation rule profile', () => {
    expect(
      areReconciliationRulesDefault(DEFAULT_RECONCILIATION_RULES)
    ).toBe(true);

    expect(
      areReconciliationRulesDefault({
        ...DEFAULT_RECONCILIATION_RULES,
        amountToleranceEnabled: true,
      })
    ).toBe(false);
  });
});
