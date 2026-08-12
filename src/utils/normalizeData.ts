import type {
  ComparableField,
} from '../types/ReconciliationResult';

export function normalizeText(
  value: string
): string {
  return value
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function areValuesEquivalent(
  field: ComparableField,
  erpValue: string | number,
  crmValue: string | number
): boolean {
  /*
   * Amounts remain strict.
   *
   * 100000 and 100001 are
   * considered a real difference.
   */
  if (field === 'monto') {
    return (
      Number(erpValue) ===
      Number(crmValue)
    );
  }

  return (
    normalizeText(
      String(erpValue)
    ) ===
    normalizeText(
      String(crmValue)
    )
  );
}