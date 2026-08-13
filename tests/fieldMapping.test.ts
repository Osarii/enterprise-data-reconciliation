import { describe, expect, it } from 'vitest';

import { DEFAULT_FIELD_MAPPING } from '../src/config/fieldMappingConfig';

import {
  getMappedSourceHeaders,
  isDefaultFieldMapping,
  normalizeHeaderName,
  suggestFieldMapping,
  validateFieldMapping,
} from '../src/utils/fieldMapping';

describe('fieldMapping', () => {
  it('normalizes source headers', () => {
    expect(normalizeHeaderName(' Customer_ID ')).toBe('customer_id');
  });

  it('suggests ERP aliases into the canonical schema', () => {
    expect(
      suggestFieldMapping([
        'customer_id',
        'customer_name',
        'balance',
        'status',
      ])
    ).toEqual({
      id: 'customer_id',
      cliente: 'customer_name',
      monto: 'balance',
      estado: 'status',
    });
  });

  it('suggests CRM aliases into the canonical schema', () => {
    expect(
      suggestFieldMapping([
        'account_code',
        'display_name',
        'amount_due',
        'lifecycle_status',
      ])
    ).toEqual({
      id: 'account_code',
      cliente: 'display_name',
      monto: 'amount_due',
      estado: 'lifecycle_status',
    });
  });

  it('prefers an existing saved mapping when the headers still exist', () => {
    const preferred = {
      id: 'account_code',
      cliente: 'display_name',
      monto: 'amount_due',
      estado: 'lifecycle_status',
    };

    expect(
      suggestFieldMapping(
        [
          'id',
          'cliente',
          'monto',
          'estado',
          ...Object.values(preferred),
        ],
        preferred
      )
    ).toEqual(preferred);
  });

  it('rejects missing and duplicated source mappings', () => {
    const missing = validateFieldMapping(
      ['id', 'cliente', 'monto'],
      DEFAULT_FIELD_MAPPING
    );

    expect(missing.valid).toBe(false);
    expect(missing.errors.some((error) => error.includes('estado'))).toBe(
      true
    );

    const duplicate = validateFieldMapping(
      ['id', 'cliente', 'monto', 'estado'],
      {
        id: 'id',
        cliente: 'cliente',
        monto: 'monto',
        estado: 'monto',
      }
    );

    expect(duplicate.valid).toBe(false);
    expect(
      duplicate.errors.some((error) =>
        error.includes('cannot be mapped to more than one')
      )
    ).toBe(true);
  });

  it('returns mapped headers and detects the default mapping', () => {
    expect(getMappedSourceHeaders(DEFAULT_FIELD_MAPPING)).toEqual([
      'id',
      'cliente',
      'monto',
      'estado',
    ]);

    expect(isDefaultFieldMapping(DEFAULT_FIELD_MAPPING)).toBe(true);
  });
});
