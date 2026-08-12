import {
  areValuesEquivalent,
} from './normalizeData';

import type {
  ReconciliationRecord,
} from '../types/ReconciliationRecord';

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
    ReconciliationRecord[]
): ReconciliationResult {
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

  /*
   * ERP → CRM
   */
  erpRecords.forEach(
    (erpRecord) => {
      const crmRecord =
        crmMap.get(
          erpRecord.id
        );

      /*
       * Record exists only
       * in ERP.
       */
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

      COMPARABLE_FIELDS.forEach(
        (field) => {
          const erpValue =
            erpRecord[field];

          const crmValue =
            crmRecord[field];

          /*
           * Perfect raw match.
           */
          if (
            erpValue ===
            crmValue
          ) {
            return;
          }

          /*
           * Raw values differ,
           * so we test normalized
           * equivalence.
           */
          const normalizedMatch =
            areValuesEquivalent(
              field,
              erpValue,
              crmValue
            );

          if (
            normalizedMatch
          ) {
            normalizedFields.push(
              field
            );

            return;
          }

          /*
           * Still different after
           * normalization.
           *
           * This is a real
           * discrepancy.
           */
          fieldDifferences.push({
            field,

            erpValue,

            crmValue,
          });
        }
      );

      /*
       * No real differences.
       */
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
            normalizedFields.length >
            0
              ? 'Normalized Match'
              : 'Exact Match',

          normalizedFields,
        });

        return;
      }

      /*
       * At least one real
       * discrepancy exists.
       */
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

  /*
   * CRM records not processed
   * exist only in CRM.
   */
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