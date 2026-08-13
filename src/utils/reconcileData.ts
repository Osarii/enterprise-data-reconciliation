import {
  DEFAULT_RECONCILIATION_RULES,
} from '../config/reconciliationRulesConfig';

import {
  areValuesEquivalent,
} from './normalizeData';

import {
  isAmountWithinTolerance,
  sanitizeReconciliationRules,
} from './reconciliationRules';

import type {
  ReconciliationRecord,
} from '../types/ReconciliationRecord';

import type {
  ReconciliationRules,
} from '../types/ReconciliationRules';

import type {
  ComparableField,
  DifferenceRecord,
  FieldDifference,
  MatchedRecord,
  ReconciliationResult,
} from '../types/ReconciliationResult';

const COMPARABLE_FIELDS:
  ComparableField[] = [
    'cliente',
    'monto',
    'estado',
  ];

export function reconcileData(
  erpRecords:
    ReconciliationRecord[],

  crmRecords:
    ReconciliationRecord[],

  rules: ReconciliationRules =
    DEFAULT_RECONCILIATION_RULES
): ReconciliationResult {
  const activeRules =
    sanitizeReconciliationRules(rules);

  const matched:
    MatchedRecord[] = [];

  const differences:
    DifferenceRecord[] = [];

  const onlyERP:
    ReconciliationRecord[] =
      [];

  const onlyCRM:
    ReconciliationRecord[] =
      [];

  /*
   * Build CRM lookup by ID.
   *
   * Duplicate IDs are already
   * blocked during import
   * validation.
   *
   * ID matching intentionally stays
   * exact in V0.1.7 because the ID is
   * the reconciliation key rather than
   * a descriptive field.
   */
  const crmMap =
    new Map<
      string,
      ReconciliationRecord
    >();

  crmRecords.forEach(
    (record) => {
      crmMap.set(
        record.id,
        record
      );
    }
  );

  const processedIds =
    new Set<string>();

  erpRecords.forEach(
    (erpRecord) => {
      const crmRecord =
        crmMap.get(
          erpRecord.id
        );

      if (!crmRecord) {
        onlyERP.push(
          erpRecord
        );

        return;
      }

      processedIds.add(
        erpRecord.id
      );

      const fieldDifferences:
        FieldDifference[] =
          [];

      const normalizedFields:
        ComparableField[] =
          [];

      const toleranceFields:
        ComparableField[] =
          [];

      COMPARABLE_FIELDS.forEach(
        (field) => {
          const erpValue =
            erpRecord[field];

          const crmValue =
            crmRecord[field];

          if (
            erpValue ===
            crmValue
          ) {
            return;
          }

          if (
            field === 'monto' &&
            isAmountWithinTolerance(
              erpValue,
              crmValue,
              activeRules
            )
          ) {
            toleranceFields.push(
              field
            );

            return;
          }

          const normalizationEnabled =
            field === 'cliente'
              ? activeRules.normalizeCustomerNames
              : field === 'estado'
                ? activeRules.normalizeStatuses
                : false;

          if (
            normalizationEnabled &&
            areValuesEquivalent(
              field,
              erpValue,
              crmValue
            )
          ) {
            normalizedFields.push(
              field
            );

            return;
          }

          fieldDifferences.push({
            field,
            erpValue,
            crmValue,
          });
        }
      );

      if (
        fieldDifferences.length ===
        0
      ) {
        matched.push({
          id:
            erpRecord.id,

          erpRecord,

          crmRecord,

          matchType:
            toleranceFields.length > 0
              ? 'Tolerance Match'
              : normalizedFields.length > 0
                ? 'Normalized Match'
                : 'Exact Match',

          normalizedFields,

          toleranceFields,
        });

        return;
      }

      differences.push({
        id:
          erpRecord.id,

        erpRecord,

        crmRecord,

        differences:
          fieldDifferences,
      });
    }
  );

  crmRecords.forEach(
    (crmRecord) => {
      if (
        !processedIds.has(
          crmRecord.id
        ) &&
        !erpRecords.some(
          (erpRecord) =>
            erpRecord.id ===
            crmRecord.id
        )
      ) {
        onlyCRM.push(
          crmRecord
        );
      }
    }
  );

  const uniqueIds =
    new Set<string>();

  erpRecords.forEach(
    (record) =>
      uniqueIds.add(
        record.id
      )
  );

  crmRecords.forEach(
    (record) =>
      uniqueIds.add(
        record.id
      )
  );

  const exactMatched =
    matched.filter(
      (record) =>
        record.matchType ===
        'Exact Match'
    ).length;

  const normalizedMatched =
    matched.filter(
      (record) =>
        record.matchType ===
        'Normalized Match'
    ).length;

  const toleranceMatched =
    matched.filter(
      (record) =>
        record.matchType ===
        'Tolerance Match'
    ).length;

  const totalUnique =
    uniqueIds.size;

  const matchRate =
    totalUnique === 0
      ? 0
      : (matched.length /
          totalUnique) *
        100;

  return {
    matched,

    differences,

    onlyERP,

    onlyCRM,

    summary: {
      totalERP:
        erpRecords.length,

      totalCRM:
        crmRecords.length,

      totalUnique,

      matched:
        matched.length,

      exactMatched,

      normalizedMatched,

      toleranceMatched,

      differences:
        differences.length,

      onlyERP:
        onlyERP.length,

      onlyCRM:
        onlyCRM.length,

      matchRate,
    },

    executedAt:
      new Date().toISOString(),
  };
}
