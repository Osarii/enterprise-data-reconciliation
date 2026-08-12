import { z } from 'zod';

export const reconciliationRecordSchema = z.object({
  id: z.string().trim().min(1, 'ID is required'),

  cliente: z.string().trim().min(1, 'Customer is required'),

  monto: z.coerce
    .number()
    .nonnegative('Amount cannot be negative'),

  estado: z.string().trim().min(1, 'Status is required'),
});