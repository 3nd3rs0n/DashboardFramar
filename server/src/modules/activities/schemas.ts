import { z } from 'zod';
import { listQuerySchema } from '../../lib/pagination.js';

export const listActivitiesQuery = listQuerySchema.extend({
  processId: z.string().optional(),
  departmentId: z.string().optional(),
  userId: z.string().optional(),
});
export type ListActivitiesQuery = z.infer<typeof listActivitiesQuery>;

// userId comes from the JWT, not the body
export const createActivityBody = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  date: z.coerce.date().optional(),
  processId: z.string().optional(),
  departmentId: z.string().optional(),
});
export type CreateActivityBody = z.infer<typeof createActivityBody>;

export const updateActivityBody = createActivityBody.partial();
export type UpdateActivityBody = z.infer<typeof updateActivityBody>;
