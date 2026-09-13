import { FindingStatus, Priority } from '@prisma/client';
import { z } from 'zod';
import { listQuerySchema } from '../../lib/pagination.js';

export const listFindingsQuery = listQuerySchema.extend({
  status: z.enum(FindingStatus).optional(),
  priority: z.enum(Priority).optional(),
  processId: z.string().optional(),
  departmentId: z.string().optional(),
});
export type ListFindingsQuery = z.infer<typeof listFindingsQuery>;

export const createFindingBody = z.object({
  title: z.string().min(1),
  type: z.string().default('AUDIT'),
  priority: z.enum(Priority).default('MEDIUM'),
  status: z.enum(FindingStatus).default('OPEN'),
  dueDate: z.coerce.date().optional(),
  closedAt: z.coerce.date().optional(),
  departmentId: z.string().min(1),
  processName: z.string().min(1),
});
export type CreateFindingBody = z.infer<typeof createFindingBody>;

export const updateFindingBody = createFindingBody.partial();
export type UpdateFindingBody = z.infer<typeof updateFindingBody>;

export const findingIdParams = z.object({ id: z.string().min(1) });
export const findingParticipantParams = findingIdParams.extend({ userId: z.string().min(1) });

export const createFindingCommentBody = z.object({
  body: z.string().trim().min(1, 'El comentario no puede estar vacío').max(2000),
});
export type CreateFindingCommentBody = z.infer<typeof createFindingCommentBody>;

export const addFindingParticipantBody = z.object({
  userId: z.string().min(1),
});
export type AddFindingParticipantBody = z.infer<typeof addFindingParticipantBody>;
