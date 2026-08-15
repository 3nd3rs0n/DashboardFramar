import { ActionStatus, ActionType } from '@prisma/client';
import { z } from 'zod';
import { listQuerySchema } from '../../lib/pagination.js';

export const listActionsQuery = listQuerySchema.extend({
  status: z.enum(ActionStatus).optional(),
  type: z.enum(ActionType).optional(),
  processId: z.string().optional(),
  departmentId: z.string().optional(),
  responsibleId: z.string().optional(),
});
export type ListActionsQuery = z.infer<typeof listActionsQuery>;

export const createActionBody = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(ActionType).default('CORRECTIVE'),
  status: z.enum(ActionStatus).default('PENDING'),
  dueDate: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
  findingId: z.string().optional(),
  nonConformityId: z.string().optional(),
  riskId: z.string().optional(),
  opportunityId: z.string().optional(),
  responsibleId: z.string().optional(),
});
export type CreateActionBody = z.infer<typeof createActionBody>;

export const updateActionBody = createActionBody.partial();
export type UpdateActionBody = z.infer<typeof updateActionBody>;
