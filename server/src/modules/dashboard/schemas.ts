import { z } from 'zod';

export const summaryQuery = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  departmentId: z.string().optional(),
  processId: z.string().optional(),
  responsibleId: z.string().optional(),
});
export type SummaryQuery = z.infer<typeof summaryQuery>;

export const chartsQuery = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  departmentId: z.string().optional(),
});
export type ChartsQuery = z.infer<typeof chartsQuery>;
