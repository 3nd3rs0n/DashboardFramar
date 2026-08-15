import { OpportunityStatus } from '@prisma/client';
import { z } from 'zod';
import { listQuerySchema } from '../../lib/pagination.js';

export const listOpportunitiesQuery = listQuerySchema.extend({
  status: z.enum(OpportunityStatus).optional(),
  processId: z.string().optional(),
  departmentId: z.string().optional(),
  responsibleId: z.string().optional(),
});
export type ListOpportunitiesQuery = z.infer<typeof listOpportunitiesQuery>;

export const createOpportunityBody = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  benefit: z.string().optional(),
  status: z.enum(OpportunityStatus).default('IDENTIFIED'),
  processId: z.string().min(1),
  responsibleId: z.string().optional(),
});
export type CreateOpportunityBody = z.infer<typeof createOpportunityBody>;

export const updateOpportunityBody = createOpportunityBody.partial();
export type UpdateOpportunityBody = z.infer<typeof updateOpportunityBody>;
