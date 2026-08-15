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
  processId: z.string().min(1),
});
export type CreateProcedureBody = z.infer<typeof createProcedureBody>;

export const updateProcedureBody = createProcedureBody.partial();
export type UpdateProcedureBody = z.infer<typeof updateProcedureBody>;
