import { KpiFrequency } from '@prisma/client';
import { z } from 'zod';
import { listQuerySchema } from '../../lib/pagination.js';

export const listKpisQuery = listQuerySchema.extend({
  frequency: z.enum(KpiFrequency).optional(),
  processId: z.string().optional(),
  departmentId: z.string().optional(),
  responsibleId: z.string().optional(),
});
export type ListKpisQuery = z.infer<typeof listKpisQuery>;

export const createKpiBody = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  formula: z.string().optional(),
  unit: z.string().default('%'),
  target: z.coerce.number(),
  frequency: z.enum(KpiFrequency).default('MONTHLY'),
  processId: z.string().min(1),
  responsibleId: z.string().optional(),
});
export type CreateKpiBody = z.infer<typeof createKpiBody>;

export const updateKpiBody = createKpiBody.partial();
export type UpdateKpiBody = z.infer<typeof updateKpiBody>;

export const listKpiValuesQuery = listQuerySchema;
export type ListKpiValuesQuery = z.infer<typeof listKpiValuesQuery>;

export const createKpiValueBody = z.object({
  value: z.coerce.number(),
  period: z.string().min(1),
  date: z.coerce.date().optional(),
});
export type CreateKpiValueBody = z.infer<typeof createKpiValueBody>;

export const kpiValueParamsSchema = z.object({
  kpiId: z.string().min(1),
  valueId: z.string().min(1),
});
