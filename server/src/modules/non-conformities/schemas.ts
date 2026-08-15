import { NonConformityStatus } from '@prisma/client';
import { z } from 'zod';
import { listQuerySchema } from '../../lib/pagination.js';

export const listNonConformitiesQuery = listQuerySchema.extend({
  status: z.enum(NonConformityStatus).optional(),
  processId: z.string().optional(),
  departmentId: z.string().optional(),
  responsibleId: z.string().optional(),
});
export type ListNonConformitiesQuery = z.infer<typeof listNonConformitiesQuery>;

export const createNonConformityBody = z.object({
  code: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  requirement: z.string().optional(),
  status: z.enum(NonConformityStatus).default('OPEN'),
  processId: z.string().min(1),
  responsibleId: z.string().optional(),
  detectedAt: z.coerce.date().optional(),
  closedAt: z.coerce.date().optional(),
});
export type CreateNonConformityBody = z.infer<typeof createNonConformityBody>;

export const updateNonConformityBody = createNonConformityBody.partial();
export type UpdateNonConformityBody = z.infer<typeof updateNonConformityBody>;
