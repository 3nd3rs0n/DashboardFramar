import { z } from 'zod';
import { listQuerySchema } from '../../lib/pagination.js';

export const listProcessesQuery = listQuerySchema.extend({
  departmentId: z.string().optional(),
});
export type ListProcessesQuery = z.infer<typeof listProcessesQuery>;

export const createProcessBody = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  departmentId: z.string().min(1),
});
export type CreateProcessBody = z.infer<typeof createProcessBody>;

export const updateProcessBody = createProcessBody.partial();
export type UpdateProcessBody = z.infer<typeof updateProcessBody>;
