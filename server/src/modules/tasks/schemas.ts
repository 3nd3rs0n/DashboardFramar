import { Priority, TaskStatus } from '@prisma/client';
import { z } from 'zod';
import { listQuerySchema } from '../../lib/pagination.js';

export const listTasksQuery = listQuerySchema.extend({
  status: z.enum(TaskStatus).optional(),
  priority: z.enum(Priority).optional(),
  departmentId: z.string().optional(),
  responsibleId: z.string().optional(),
});
export type ListTasksQuery = z.infer<typeof listTasksQuery>;

export const createTaskBody = z.object({
  title: z.string().min(1),
  status: z.enum(TaskStatus).default('PENDING'),
  priority: z.enum(Priority).default('MEDIUM'),
  dueDate: z.coerce.date().optional(),
  completedAt: z.coerce.date().nullable().optional(),
  departmentId: z.string().optional(),
  responsibleId: z.string().optional(),
});
export type CreateTaskBody = z.infer<typeof createTaskBody>;

export const updateTaskBody = createTaskBody.partial();
export type UpdateTaskBody = z.infer<typeof updateTaskBody>;

export const taskIdParams = z.object({ id: z.string().min(1) });

export const createTaskCommentBody = z.object({
  body: z.string().trim().min(1, 'El comentario no puede estar vacío').max(2000),
});
export type CreateTaskCommentBody = z.infer<typeof createTaskCommentBody>;
