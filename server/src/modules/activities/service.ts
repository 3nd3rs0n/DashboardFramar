import type { Prisma, PrismaClient } from '@prisma/client';
import { pageArgs } from '../../lib/pagination.js';
import type {
  CreateActivityBody,
  ListActivitiesQuery,
  UpdateActivityBody,
} from './schemas.js';

const include = {
  user: { select: { id: true, name: true, email: true } },
  process: { include: { department: true } },
  department: true,
} satisfies Prisma.ActivityInclude;

export function activityService(prisma: PrismaClient) {
  return {
    async list(q: ListActivitiesQuery) {
      const where: Prisma.ActivityWhereInput = {
        ...(q.search
          ? {
              OR: [
                { title: { contains: q.search, mode: 'insensitive' } },
                { description: { contains: q.search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(q.processId ? { processId: q.processId } : {}),
        ...(q.departmentId ? { departmentId: q.departmentId } : {}),
        ...(q.userId ? { userId: q.userId } : {}),
        // activities are dated by their `date` field, not createdAt
        ...(q.from || q.to
          ? { date: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) } }
          : {}),
      };
      const [data, total] = await Promise.all([
        prisma.activity.findMany({ where, include, ...pageArgs(q), orderBy: { date: 'desc' } }),
        prisma.activity.count({ where }),
      ]);
      return { data, total };
    },
    get: (id: string) => prisma.activity.findUnique({ where: { id }, include }),
    create: (data: CreateActivityBody, userId: string) =>
      prisma.activity.create({ data: { ...data, userId }, include }),
    update: (id: string, data: UpdateActivityBody) =>
      prisma.activity.update({ where: { id }, data, include }),
    remove: async (id: string) => {
      await prisma.activity.delete({ where: { id } });
    },
  };
}
