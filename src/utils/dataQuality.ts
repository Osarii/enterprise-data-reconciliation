import {
  ALLOWED_STATUSES,
  DATA_QUALITY_SCORE_WEIGHTS,
  ID_VALIDATION_CONFIG,
  type AllowedStatus,
} from '../config/dataQualityConfig';

import type {
  DataQualityIssue,
  DataQualityIssueBreakdown,
  DataQualityIssueType,
  DataQualitySummary,
} from '../types/CsvValidation';

import { normalizeText } from './normalizeData';

const INVALID_VALUE_TYPES = new Set<DataQualityIssueType>([
  'Missing Value',
  'Invalid Amount',
  'Negative Amount',
  'Invalid Status',
]);

const STRUCTURAL_BLOCKING_TYPES = new Set<DataQualityIssueType>([
  'Missing Column',
  'CSV Parse Error',
  'Empty File',
  'Invalid Field Mapping',
]);

const STRUCTURAL_WARNING_TYPES = new Set<DataQualityIssueType>([
  'Unexpected Column',
]);

const statusLookup = new Map<string, AllowedStatus>(
  ALLOWED_STATUSES.map((status) => [
    normalizeText(status),
    status,
  ])
);

interface BuildDataQualitySummaryOptions {
  issues: DataQualityIssue[];
  totalRows: number;
  issueRows: Set<number>;
  blockingRows: Set<number>;
  warningRows: Set<number>;
  duplicateRows: Set<number>;
}

export function getCanonicalStatus(
  value: string
): AllowedStatus | null {
  return statusLookup.get(normalizeText(value)) ?? null;
}

export function isAllowedStatus(
  value: string
): boolean {
  return getCanonicalStatus(value) !== null;
}

export function hasBlockingIssues(
  issues: DataQualityIssue[]
): boolean {
  return issues.some(
    (issue) => issue.severity === 'BLOCKING'
  );
}

export function getBlockingIssues(
  issues: DataQualityIssue[]
): DataQualityIssue[] {
  return issues.filter(
    (issue) => issue.severity === 'BLOCKING'
  );
}

export function getWarningIssues(
  issues: DataQualityIssue[]
): DataQualityIssue[] {
  return issues.filter(
    (issue) => issue.severity === 'WARNING'
  );
}

export function createSuspiciousIdIssue(
  rawId: string,
  row: number
): DataQualityIssue | null {
  const trimmedId = rawId.trim();

  if (!trimmedId) {
    return null;
  }

  const reasons: string[] = [];

  if (rawId !== trimmedId) {
    reasons.push('leading or trailing whitespace');
  }

  if (
    trimmedId.length <
    ID_VALIDATION_CONFIG.minLength
  ) {
    reasons.push(
      `fewer than ${ID_VALIDATION_CONFIG.minLength} characters`
    );
  }

  if (
    trimmedId.length >
    ID_VALIDATION_CONFIG.maxLength
  ) {
    reasons.push(
      `more than ${ID_VALIDATION_CONFIG.maxLength} characters`
    );
  }

  if (/\s/u.test(trimmedId)) {
    reasons.push('internal whitespace');
  }

  if (!/^[\p{L}\p{N}._/\-\s]+$/u.test(trimmedId)) {
    reasons.push('unusual characters');
  }

  if (/^[._/-]|[._/-]$/u.test(trimmedId)) {
    reasons.push('starts or ends with a separator');
  }

  if (/[._/-]{2,}/u.test(trimmedId)) {
    reasons.push('repeated separators');
  }

  if (reasons.length === 0) {
    return null;
  }

  return {
    type: 'Suspicious ID',
    severity: 'WARNING',
    message: `Row ${row} — id: Suspicious identifier "${trimmedId}" (${reasons.join(
      '; '
    )}).`,
    row,
    field: 'id',
    value: rawId,
  };
}

export function buildDataQualitySummary({
  issues,
  totalRows,
  issueRows,
  blockingRows,
  warningRows,
  duplicateRows,
}: BuildDataQualitySummaryOptions): DataQualitySummary {
  const blockingIssues = issues.filter(
    (issue) => issue.severity === 'BLOCKING'
  ).length;

  const warnings = issues.filter(
    (issue) => issue.severity === 'WARNING'
  ).length;

  const duplicateIds = issues.filter(
    (issue) => issue.type === 'Duplicate ID'
  ).length;

  const invalidValues = issues.filter((issue) =>
    INVALID_VALUE_TYPES.has(issue.type)
  ).length;

  const suspiciousIds = issues.filter(
    (issue) => issue.type === 'Suspicious ID'
  ).length;

  const cleanRows = Math.max(
    totalRows - issueRows.size,
    0
  );

  const rowsWithIssues = Math.min(
    issueRows.size,
    totalRows
  );

  return {
    score: calculateDataQualityScore({
      issues,
      totalRows,
      blockingRows: blockingRows.size,
      warningRows: warningRows.size,
      duplicateRows: duplicateRows.size,
    }),
    blockingIssues,
    warnings,
    duplicateIds,
    invalidValues,
    suspiciousIds,
    cleanRows,
    rowsWithIssues,
    blockingRows: Math.min(
      blockingRows.size,
      totalRows
    ),
    warningRows: Math.min(
      warningRows.size,
      totalRows
    ),
    issueBreakdown: buildIssueBreakdown(issues),
  };
}

interface CalculateScoreOptions {
  issues: DataQualityIssue[];
  totalRows: number;
  blockingRows: number;
  warningRows: number;
  duplicateRows: number;
}

function calculateDataQualityScore({
  issues,
  totalRows,
  blockingRows,
  warningRows,
  duplicateRows,
}: CalculateScoreOptions): number {
  if (totalRows === 0) {
    return 0;
  }

  const blockingRowPenalty =
    DATA_QUALITY_SCORE_WEIGHTS.blockingRows *
    (blockingRows / totalRows);

  const warningRowPenalty =
    DATA_QUALITY_SCORE_WEIGHTS.warningRows *
    (warningRows / totalRows);

  const duplicateRowPenalty =
    DATA_QUALITY_SCORE_WEIGHTS.duplicateRows *
    (duplicateRows / totalRows);

  const hasStructuralBlockingIssue = issues.some(
    (issue) =>
      issue.severity === 'BLOCKING' &&
      STRUCTURAL_BLOCKING_TYPES.has(issue.type)
  );

  const structuralBlockingPenalty =
    hasStructuralBlockingIssue
      ? DATA_QUALITY_SCORE_WEIGHTS.structuralBlocking
      : 0;

  const structuralWarningCount = issues.filter(
    (issue) =>
      issue.severity === 'WARNING' &&
      STRUCTURAL_WARNING_TYPES.has(issue.type)
  ).length;

  const structuralWarningPenalty = Math.min(
    DATA_QUALITY_SCORE_WEIGHTS.structuralWarningsMax,
    structuralWarningCount *
      DATA_QUALITY_SCORE_WEIGHTS.structuralWarningPerIssue
  );

  const rawScore =
    100 -
    blockingRowPenalty -
    warningRowPenalty -
    duplicateRowPenalty -
    structuralBlockingPenalty -
    structuralWarningPenalty;

  return Math.round(
    Math.max(0, Math.min(100, rawScore)) * 10
  ) / 10;
}

function buildIssueBreakdown(
  issues: DataQualityIssue[]
): DataQualityIssueBreakdown[] {
  const breakdown = new Map<
    DataQualityIssueType,
    DataQualityIssueBreakdown
  >();

  issues.forEach((issue) => {
    const current = breakdown.get(issue.type) ?? {
      type: issue.type,
      count: 0,
      blockingCount: 0,
      warningCount: 0,
    };

    current.count += 1;

    if (issue.severity === 'BLOCKING') {
      current.blockingCount += 1;
    } else {
      current.warningCount += 1;
    }

    breakdown.set(issue.type, current);
  });

  return Array.from(breakdown.values()).sort((a, b) => {
    if (a.blockingCount !== b.blockingCount) {
      return b.blockingCount - a.blockingCount;
    }

    if (a.count !== b.count) {
      return b.count - a.count;
    }

    return a.type.localeCompare(b.type);
  });
}
