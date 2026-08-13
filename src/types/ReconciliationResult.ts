import type {
  ReconciliationRecord,
} from './ReconciliationRecord';

import type {
  ReconciliationProcessingMetrics,
} from './ProcessingMetrics';

export type ComparableField =
  | 'cliente'
  | 'monto'
  | 'estado';

export type MatchType =
  | 'Exact Match'
  | 'Normalized Match'
  | 'Tolerance Match';

export interface FieldDifference {
  field: ComparableField;

  erpValue:
    | string
    | number;

  crmValue:
    | string
    | number;
}

export interface MatchedRecord {
  id: string;

  erpRecord:
    ReconciliationRecord;

  crmRecord:
    ReconciliationRecord;

  matchType: MatchType;

  /*
   * Fields that were different
   * in their raw representation,
   * but became equal after
   * normalization.
   */
  normalizedFields:
    ComparableField[];

  /*
   * Fields accepted by a configured
   * reconciliation rule. V0.1.7 uses
   * this for absolute amount tolerance.
   */
  toleranceFields:
    ComparableField[];
}

export interface DifferenceRecord {
  id: string;

  erpRecord:
    ReconciliationRecord;

  crmRecord:
    ReconciliationRecord;

  differences:
    FieldDifference[];
}

export interface ReconciliationSummary {
  totalERP: number;

  totalCRM: number;

  totalUnique: number;

  /*
   * Total matches:
   * exact + normalized + tolerance.
   */
  matched: number;

  exactMatched: number;

  normalizedMatched: number;

  toleranceMatched: number;

  differences: number;

  onlyERP: number;

  onlyCRM: number;

  matchRate: number;
}

export interface ReconciliationResult {
  matched:
    MatchedRecord[];

  differences:
    DifferenceRecord[];

  onlyERP:
    ReconciliationRecord[];

  onlyCRM:
    ReconciliationRecord[];

  summary:
    ReconciliationSummary;

  executedAt: string;

  processing: ReconciliationProcessingMetrics;
}
