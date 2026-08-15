import { Priority, TaskStatus } from '@prisma/client';
import { z } from 'zod';
import { listQuerySchema } from '../../lib/pagination.js';

export const listTasksQuery = listQuerySchema.extend({
  status: z.enum(TaskStatus).optional(),
  priority: z.enum(Priority).optional(),
  actionId: z.string().optional(),
  processId: z.string().optional(),
  departmentId: z.string().optional(),
  responsibleId: z.string().optional(),
});
export type ListTasksQuery = z.infer<typeof listTasksQuery>;

export const createTaskBody = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(TaskStatus).default('PENDING'),
  priority: z.enum(Priority).default('MEDIUM'),
  dueDate: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
  actionId: z.string().optional(),
  processId: z.string().optional(),
  responsibleId: z.string().optional(),
});
export type CreateTaskBody = z.infer<typeof createTaskBody>;

export const updateTaskBody = createTaskBody.partial();
export type UpdateTaskBody = z.infer<typeof updateTaskBody>;
