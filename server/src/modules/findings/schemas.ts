import { FindingStatus, Priority } from '@prisma/client';
import { z } from 'zod';
import { listQuerySchema } from '../../lib/pagination.js';

export const listFindingsQuery = listQuerySchema.extend({
  status: z.enum(FindingStatus).optional(),
  priority: z.enum(Priority).optional(),
  processId: z.string().optional(),
  departmentId: z.string().optional(),
  responsibleId: z.string().optional(),
});
export type ListFindingsQuery = z.infer<typeof listFindingsQuery>;

export const createFindingBody = z.object({
  code: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.string().default('AUDIT'),
  priority: z.enum(Priority).default('MEDIUM'),
  status: z.enum(FindingStatus).default('OPEN'),
  cause: z.string().optional(),
  evidence: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  closedAt: z.coerce.date().optional(),
  processId: z.string().min(1),
  responsibleId: z.string().optional(),
});
export type CreateFindingBody = z.infer<typeof createFindingBody>;

export const updateFindingBody = createFindingBody.partial();
export type UpdateFindingBody = z.infer<typeof updateFindingBody>;
