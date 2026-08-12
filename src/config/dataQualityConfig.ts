export const REQUIRED_HEADERS = [
  'id',
  'cliente',
  'monto',
  'estado',
] as const;

export const ALLOWED_STATUSES = [
  'Activo',
  'Inactivo',
  'Pendiente',
] as const;

export type AllowedStatus =
  (typeof ALLOWED_STATUSES)[number];

export const ID_VALIDATION_CONFIG = {
  minLength: 3,
  maxLength: 64,
} as const;

export const DATA_QUALITY_SCORE_WEIGHTS = {
  blockingRows: 60,
  warningRows: 15,
  duplicateRows: 15,
  structuralBlocking: 10,
  structuralWarningsMax: 5,
  structuralWarningPerIssue: 2,
} as const;
