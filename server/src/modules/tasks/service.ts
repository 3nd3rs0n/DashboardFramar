import type { Prisma, PrismaClient } from '@prisma/client';
import { createdAtRange, pageArgs } from '../../lib/pagination.js';
import type { CreateTaskBody, ListTasksQuery, UpdateTaskBody } from './schemas.js';

const include = {
  department: true,
  comments: {
    where: { user: { role: { not: 'ADMIN' } } },
    select: { id: true },
    take: 1,
  },
} satisfies Prisma.TaskInclude;

export function taskService(prisma: PrismaClient) {
  return {
    async list(q: ListTasksQuery) {
      const where: Prisma.TaskWhereInput = {
        ...(q.search
          ? {
              OR: [
                { title: { contains: q.search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(q.status ? { status: q.status } : {}),
        ...(q.priority ? { priority: q.priority } : {}),
        ...(q.departmentId ? { departmentId: q.departmentId } : {}),
        ...(q.responsibleId ? { responsibleId: q.responsibleId } : {}),
        ...createdAtRange(q),
      };
      const [data, total, pending, inProgress, done, cancelled] = await Promise.all([
        prisma.task.findMany({ where, include, ...pageArgs(q), orderBy: { createdAt: 'desc' } }),
        prisma.task.count({ where }),
        prisma.task.count({ where: { ...where, status: 'PENDING' } }),
        prisma.task.count({ where: { ...where, status: 'IN_PROGRESS' } }),
        prisma.task.count({ where: { ...where, status: 'DONE' } }),
        prisma.task.count({ where: { ...where, status: 'CANCELLED' } }),
      ]);
      return { data, total, counts: { pending, inProgress, done, cancelled } };
    },
    get: (id: string) => prisma.task.findUnique({ where: { id }, include }),
    create: (data: CreateTaskBody) => prisma.task.create({ data, include }),
    update: (id: string, data: UpdateTaskBody) =>
      prisma.task.update({ where: { id }, data, include }),
    remove: async (id: string) => {
      await prisma.task.delete({ where: { id } });
    },
  };
}
