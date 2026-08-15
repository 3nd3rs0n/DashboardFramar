import { z } from 'zod';
import { listQuerySchema } from '../../lib/pagination.js';

export const listDepartmentsQuery = listQuerySchema;
export type ListDepartmentsQuery = z.infer<typeof listDepartmentsQuery>;

export const createDepartmentBody = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});
export type CreateDepartmentBody = z.infer<typeof createDepartmentBody>;

export const updateDepartmentBody = createDepartmentBody.partial();
export type UpdateDepartmentBody = z.infer<typeof updateDepartmentBody>;
