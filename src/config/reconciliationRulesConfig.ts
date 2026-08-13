import type {
  ReconciliationRules,
} from '../types/ReconciliationRules';

export const DEFAULT_RECONCILIATION_RULES: ReconciliationRules = {
  normalizeCustomerNames: true,
  normalizeStatuses: true,
  amountToleranceEnabled: false,
  amountTolerance: 0,
};

/*
 * A generous UI guardrail rather than a business standard.
 * The future backend will move rule validation into organization-level
 * configuration and can use currency-aware limits.
 */
export const MAX_ABSOLUTE_AMOUNT_TOLERANCE = 1_000_000_000;
