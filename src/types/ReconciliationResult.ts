import type { ReconciliationRecord } from './ReconciliationRecord';

export type ComparableField =
  | 'cliente'
  | 'monto'
  | 'estado';

export interface FieldDifference {
  field: ComparableField;
  erpValue: string | number;
  crmValue: string | number;
}

export interface MatchedRecord {
  id: string;
  erpRecord: ReconciliationRecord;
  crmRecord: ReconciliationRecord;
}

export interface DifferenceRecord {
  id: string;
  erpRecord: ReconciliationRecord;
  crmRecord: ReconciliationRecord;
  differences: FieldDifference[];
}

export interface ReconciliationSummary {
  totalERP: number;
  totalCRM: number;
  totalUnique: number;

  matched: number;
  differences: number;
  onlyERP: number;
  onlyCRM: number;

  matchRate: number;
}

export interface ReconciliationResult {
  matched: MatchedRecord[];
  differences: DifferenceRecord[];
  onlyERP: ReconciliationRecord[];
  onlyCRM: ReconciliationRecord[];

  summary: ReconciliationSummary;

  executedAt: string;
}