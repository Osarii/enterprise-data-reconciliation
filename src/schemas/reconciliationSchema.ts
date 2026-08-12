import { z } from 'zod';

import { isAllowedStatus } from '../utils/dataQuality';

const amountSchema = z
  .union([z.string(), z.number()])
  .refine(
    (value) => String(value).trim().length > 0,
    {
      message: 'Amount is required',
    }
  )
  .transform((value) => {
    if (typeof value === 'number') {
      return value;
    }

    return Number(value.trim());
  })
  .refine(
    (value) => Number.isFinite(value),
    {
      message: 'Amount must be a valid number',
    }
  )
  .refine(
    (value) => Number.isFinite(value) && value >= 0,
    {
      message: 'Amount cannot be negative',
    }
  );

export const reconciliationRecordSchema = z.object({
  id: z.string().trim().min(1, 'ID is required'),

  cliente: z
    .string()
    .trim()
    .min(1, 'Customer is required'),

  monto: amountSchema,

  estado: z
    .string()
    .trim()
    .min(1, 'Status is required')
    .refine(
      (value) => value.length === 0 || isAllowedStatus(value),
      {
        message:
          'Status is not in the configured allowed status list',
      }
    ),
});
