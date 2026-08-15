import { RiskStatus } from '@prisma/client';
import { z } from 'zod';
import { listQuerySchema } from '../../lib/pagination.js';

export const listRisksQuery = listQuerySchema.extend({
  status: z.enum(RiskStatus).optional(),
  processId: z.string().optional(),
  departmentId: z.string().optional(),
  responsibleId: z.string().optional(),
});
export type ListRisksQuery = z.infer<typeof listRisksQuery>;

export const createRiskBody = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  probability: z.coerce.number().int().min(1).max(5).default(1),
  impact: z.coerce.number().int().min(1).max(5).default(1),
  level: z.coerce.number().int().min(1).max(25).optional(),
  status: z.enum(RiskStatus).default('IDENTIFIED'),
  mitigation: z.string().optional(),
  processId: z.string().min(1),
  responsibleId: z.string().optional(),
});
export type CreateRiskBody = z.infer<typeof createRiskBody>;

export const updateRiskBody = createRiskBody.partial();
export type UpdateRiskBody = z.infer<typeof updateRiskBody>;
