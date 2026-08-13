import { describe, expect, it } from 'vitest';

import { reconciliationRecordSchema } from '../src/schemas/reconciliationSchema';

describe('reconciliationRecordSchema', () => {
  it('parses a valid record and converts amount to number', () => {
    const result = reconciliationRecordSchema.safeParse({
      id: ' CUS-001 ',
      cliente: ' Café Central ',
      monto: '120000.50',
      estado: ' ACTIVO ',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.id).toBe('CUS-001');
      expect(result.data.cliente).toBe('Café Central');
      expect(result.data.monto).toBe(120000.5);
      expect(result.data.estado).toBe('ACTIVO');
    }
  });

  it.each([
    ['', 'empty amount'],
    ['abc', 'invalid amount'],
    [-1, 'negative amount'],
  ])('rejects %s as %s', (monto: string | number) => {
    const result = reconciliationRecordSchema.safeParse({
      id: 'CUS-001',
      cliente: 'Cliente',
      monto,
      estado: 'Activo',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid configured status', () => {
    const result = reconciliationRecordSchema.safeParse({
      id: 'CUS-001',
      cliente: 'Cliente',
      monto: 100,
      estado: 'Cancelado',
    });

    expect(result.success).toBe(false);
  });

  it('rejects missing required values', () => {
    const result = reconciliationRecordSchema.safeParse({
      id: '',
      cliente: '',
      monto: 100,
      estado: 'Activo',
    });

    expect(result.success).toBe(false);
  });
});
