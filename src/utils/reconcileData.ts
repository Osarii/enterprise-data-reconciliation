import type { ReconciliationRecord } from '../types/ReconciliationRecord';

import type {
  ComparableField,
  DifferenceRecord,
  FieldDifference,
  MatchedRecord,
  ReconciliationResult,
} from '../types/ReconciliationResult';

const comparableFields: ComparableField[] = [
  'cliente',
  'monto',
  'estado',
];

export function reconcileData(
  erpRecords: ReconciliationRecord[],
  crmRecords: ReconciliationRecord[]
): ReconciliationResult {
  const matched: MatchedRecord[] = [];
  const differences: DifferenceRecord[] = [];
  const onlyERP: ReconciliationRecord[] = [];
  const onlyCRM: ReconciliationRecord[] = [];

  const crmMap = new Map<string, ReconciliationRecord>();

  crmRecords.forEach((record) => {
    crmMap.set(record.id, record);
  });

  const processedCRMIds = new Set<string>();

  erpRecords.forEach((erpRecord) => {
    const crmRecord = crmMap.get(erpRecord.id);

    // Record only exists in ERP
    if (!crmRecord) {
      onlyERP.push(erpRecord);
      return;
    }

    processedCRMIds.add(crmRecord.id);

    const fieldDifferences: FieldDifference[] = [];

    comparableFields.forEach((field) => {
      const erpValue = erpRecord[field];
      const crmValue = crmRecord[field];

      if (erpValue !== crmValue) {
        fieldDifferences.push({
          field,
          erpValue,
          crmValue,
        });
      }
    });

    // Perfect match
    if (fieldDifferences.length === 0) {
      matched.push({
        id: erpRecord.id,
        erpRecord,
        crmRecord,
      });

      return;
    }

    // Same ID but different information
    differences.push({
      id: erpRecord.id,
      erpRecord,
      crmRecord,
      differences: fieldDifferences,
    });
  });

  // Records existing only in CRM
  crmRecords.forEach((crmRecord) => {
    if (!processedCRMIds.has(crmRecord.id)) {
      onlyCRM.push(crmRecord);
    }
  });

  const uniqueIds = new Set<string>();

  erpRecords.forEach((record) => {
    uniqueIds.add(record.id);
  });

  crmRecords.forEach((record) => {
    uniqueIds.add(record.id);
  });

  const totalUnique = uniqueIds.size;

  const matchRate =
    totalUnique === 0
      ? 0
      : (matched.length / totalUnique) * 100;

  return {
    matched,
    differences,
    onlyERP,
    onlyCRM,

    summary: {
      totalERP: erpRecords.length,
      totalCRM: crmRecords.length,
      totalUnique,

      matched: matched.length,
      differences: differences.length,
      onlyERP: onlyERP.length,
      onlyCRM: onlyCRM.length,

      matchRate,
    },

    executedAt: new Date().toISOString(),
  };
}