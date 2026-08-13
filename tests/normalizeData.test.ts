import { describe, expect, it } from 'vitest';

import {
  areValuesEquivalent,
  normalizeText,
} from '../src/utils/normalizeData';

describe('normalizeData', () => {
  it('normalizes whitespace, casing and diacritics', () => {
    expect(normalizeText('  Café    Central  ')).toBe('cafe central');
    expect(normalizeText('MEDICAL SOLUTIONS CR')).toBe(
      'medical solutions cr'
    );
  });

  it('treats normalized customer and status text as equivalent', () => {
    expect(
      areValuesEquivalent(
        'cliente',
        'Café Central',
        '  CAFE   CENTRAL '
      )
    ).toBe(true);

    expect(
      areValuesEquivalent('estado', 'Activo', ' ACTIVO ')
    ).toBe(true);
  });

  it('keeps monetary comparison strict', () => {
    expect(areValuesEquivalent('monto', 120000, '120000')).toBe(true);
    expect(areValuesEquivalent('monto', 120000, 120001)).toBe(false);
  });
});
