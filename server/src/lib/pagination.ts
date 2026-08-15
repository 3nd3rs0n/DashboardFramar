import { z } from 'zod';

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const idParamsSchema = z.object({ id: z.string().min(1) });

export type ListQuery = z.infer<typeof listQuerySchema>;

export function pageArgs(q: { page: number; limit: number }): { skip: number; take: number } {
  return { skip: (q.page - 1) * q.limit, take: q.limit };
}

export function createdAtRange(q: { from?: Date; to?: Date }): { createdAt?: { gte?: Date; lte?: Date } } {
  if (!q.from && !q.to) return {};
  return { createdAt: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) } };
}
