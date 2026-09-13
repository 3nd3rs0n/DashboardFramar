import { ProcedureStatus } from '@prisma/client';
import { z } from 'zod';
import { listQuerySchema } from '../../lib/pagination.js';

export const listProceduresQuery = listQuerySchema.extend({
  status: z.enum(ProcedureStatus).optional(),
  processId: z.string().optional(),
  departmentId: z.string().optional(),
});
export type ListProceduresQuery = z.infer<typeof listProceduresQuery>;

export const createProcedureBody = z.object({
  code: z.string().optional(),
  title: z.string().min(1),
  content: z.string().optional(),
  version: z.string().default('1.0'),
  status: z.enum(ProcedureStatus).default('DRAFT'),
  dueDate: z.coerce.date().optional(),
  departmentId: z.string().min(1),
  processName: z.string().min(1),
});
export type CreateProcedureBody = z.infer<typeof createProcedureBody>;

export const updateProcedureBody = createProcedureBody.partial();
export type UpdateProcedureBody = z.infer<typeof updateProcedureBody>;

export const createProcedureCommentBody = z.object({
  body: z.string().trim().min(1, 'El comentario no puede estar vacío').max(2000),
});
export type CreateProcedureCommentBody = z.infer<typeof createProcedureCommentBody>;
