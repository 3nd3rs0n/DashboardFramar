import { z } from 'zod';
import { listQuerySchema } from '../../lib/pagination.js';

export const bonusFindingsQuery = listQuerySchema.extend({
  departmentId: z.string().optional(),
  status: z.string().optional(),
});
export type BonusFindingsQuery = z.infer<typeof bonusFindingsQuery>;

export const bonusFindingBody = z.object({
  detectionDate: z.coerce.date().default(() => new Date()),
  departmentId: z.string().min(1),
  description: z.string().trim().min(1),
  cause: z.string().trim().optional(),
  impact: z.string().trim().optional(),
  responsibleId: z.string().trim().optional(),
  proposedAction: z.string().trim().optional(),
  status: z.string().trim().min(1).default('OPEN'),
  closeDate: z.coerce.date().optional(),
  evidence: z.string().trim().optional(),
});
export type BonusFindingBody = z.infer<typeof bonusFindingBody>;

export const bonusActionsQuery = listQuerySchema.extend({
  status: z.string().optional(),
  findingId: z.string().optional(),
});
export type BonusActionsQuery = z.infer<typeof bonusActionsQuery>;

export const bonusActionBody = z.object({
  findingId: z.string().optional(),
  action: z.string().trim().min(1),
  responsibleId: z.string().trim().optional(),
  committedDate: z.coerce.date().optional(),
  closeDate: z.coerce.date().optional(),
  status: z.string().trim().min(1).default('OPEN'),
  evidence: z.string().trim().optional(),
  result: z.string().trim().optional(),
  indicatorBefore: z.string().trim().optional(),
  indicatorAfter: z.string().trim().optional(),
  resultValidated: z.boolean().default(false),
});
export type BonusActionBody = z.infer<typeof bonusActionBody>;

export const bonusProceduresQuery = listQuerySchema.extend({
  departmentId: z.string().optional(),
  processId: z.string().optional(),
});
export type BonusProceduresQuery = z.infer<typeof bonusProceduresQuery>;

export const bonusProcedureBody = z.object({
  name: z.string().trim().min(1),
  departmentId: z.string().min(1),
  processId: z.string().min(1),
  identificationDate: z.coerce.date().default(() => new Date()),
  responsibleId: z.string().trim().optional(),
  analysisStatus: z.string().trim().min(1).default('PENDING'),
  draftingStatus: z.string().trim().min(1).default('PENDING'),
  validationStatus: z.string().trim().min(1).default('PENDING'),
  approvalDate: z.coerce.date().optional(),
  diffusionDate: z.coerce.date().optional(),
  version: z.string().trim().min(1).default('1.0'),
  evidence: z.string().trim().optional(),
});
export type BonusProcedureBody = z.infer<typeof bonusProcedureBody>;

export const bonusPeriodQuery = z.object({
  year: z.coerce.number().int().min(2000).max(2200),
  month: z.coerce.number().int().min(1).max(12),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  departmentId: z.string().optional(),
});
export type BonusPeriodQuery = z.infer<typeof bonusPeriodQuery>;

export const bonusConfigKeyParams = z.object({ key: z.string().min(1) });
export const bonusRecordParams = z.object({ id: z.string().min(1) });

export const bonusConfigBody = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  maxPoints: z.number().int().positive().optional(),
  thresholds: z
    .array(z.object({ minCount: z.number().int().nonnegative(), points: z.number().int().nonnegative() }))
    .min(1)
    .optional(),
});
export type BonusConfigBody = z.infer<typeof bonusConfigBody>;

export const bonusHistoryParams = z.object({
  entity: z.enum(['finding', 'action', 'procedure']),
  id: z.string().min(1),
});
