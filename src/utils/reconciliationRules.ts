import {
  DEFAULT_RECONCILIATION_RULES,
  MAX_ABSOLUTE_AMOUNT_TOLERANCE,
} from '../config/reconciliationRulesConfig';

import type {
  ReconciliationRules,
} from '../types/ReconciliationRules';

export function sanitizeReconciliationRules(
  rules: ReconciliationRules
): ReconciliationRules {
  const numericTolerance = Number(rules.amountTolerance);

  const amountTolerance = Number.isFinite(numericTolerance)
    ? Math.min(
        MAX_ABSOLUTE_AMOUNT_TOLERANCE,
        Math.max(0, numericTolerance)
      )
    : 0;

  return {
    normalizeCustomerNames: Boolean(
      rules.normalizeCustomerNames
    ),
    normalizeStatuses: Boolean(rules.normalizeStatuses),
    amountToleranceEnabled: Boolean(
      rules.amountToleranceEnabled
    ),
    amountTolerance,
  };
}

export function isAmountWithinTolerance(
  erpValue: string | number,
  crmValue: string | number,
  rules: ReconciliationRules
): boolean {
  if (!rules.amountToleranceEnabled) {
    return false;
  }

  const erpAmount = Number(erpValue);
  const crmAmount = Number(crmValue);

  if (
    !Number.isFinite(erpAmount) ||
    !Number.isFinite(crmAmount)
  ) {
    return false;
  }

  return (
    Math.abs(erpAmount - crmAmount) <= rules.amountTolerance
  );
}

export function areReconciliationRulesDefault(
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
