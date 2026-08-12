export interface DuplicateIdInfo {
  id: string;
  rows: number[];
}

export type DataQualitySeverity =
  | 'BLOCKING'
  | 'WARNING';

export type DataQualityIssueType =
  | 'Missing Value'
  | 'Invalid Amount'
  | 'Negative Amount'
  | 'Duplicate ID'
  | 'Invalid Status'
  | 'Suspicious ID'
  | 'Unexpected Column'
  | 'Missing Column'
  | 'CSV Parse Error'
  | 'Empty File'
  | 'Invalid Field Mapping';

export type DataQualityField =
  | 'id'
  | 'cliente'
  | 'monto'
  | 'estado'
  | 'header'
  | 'csv';

export interface DataQualityIssue {
  type: DataQualityIssueType;
  severity: DataQualitySeverity;
  message: string;
  row?: number;
  field?: DataQualityField;
  value?: string | number | null;
  relatedRows?: number[];
}

export interface DataQualityIssueBreakdown {
  type: DataQualityIssueType;
  count: number;
  blockingCount: number;
  warningCount: number;
}

export interface DataQualitySummary {
  score: number;
  blockingIssues: number;
  warnings: number;
  duplicateIds: number;
  invalidValues: number;
  suspiciousIds: number;
  cleanRows: number;
  rowsWithIssues: number;
  blockingRows: number;
  warningRows: number;
  issueBreakdown: DataQualityIssueBreakdown[];
}
