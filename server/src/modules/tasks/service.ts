import type { Prisma, PrismaClient } from '@prisma/client';
import { createdAtRange, pageArgs } from '../../lib/pagination.js';
import type { CreateTaskBody, ListTasksQuery, UpdateTaskBody } from './schemas.js';

const include = {
  action: { select: { id: true, title: true } },
  process: { include: { department: true } },
} satisfies Prisma.TaskInclude;

export function taskService(prisma: PrismaClient) {
  return {
    async list(q: ListTasksQuery) {
      const where: Prisma.TaskWhereInput = {
        ...(q.search
          ? {
              OR: [
                { title: { contains: q.search, mode: 'insensitive' } },
                { description: { contains: q.search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(q.status ? { status: q.status } : {}),
        ...(q.priority ? { priority: q.priority } : {}),
        ...(q.actionId ? { actionId: q.actionId } : {}),
        ...(q.processId ? { processId: q.processId } : {}),
        ...(q.departmentId ? { process: { departmentId: q.departmentId } } : {}),
        ...(q.responsibleId ? { responsibleId: q.responsibleId } : {}),
        ...createdAtRange(q),
      };
      const [data, total] = await Promise.all([
        prisma.task.findMany({ where, include, ...pageArgs(q), orderBy: { createdAt: 'desc' } }),
        prisma.task.count({ where }),
      ]);
      return { data, total };
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
