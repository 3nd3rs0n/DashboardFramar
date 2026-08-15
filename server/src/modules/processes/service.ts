import type { Prisma, PrismaClient } from '@prisma/client';
import { createdAtRange, pageArgs } from '../../lib/pagination.js';
import type { CreateProcessBody, ListProcessesQuery, UpdateProcessBody } from './schemas.js';

const include = { department: true } satisfies Prisma.ProcessInclude;

export function processService(prisma: PrismaClient) {
  return {
    async list(q: ListProcessesQuery) {
      const where: Prisma.ProcessWhereInput = {
        ...(q.search
          ? {
              OR: [
                { name: { contains: q.search, mode: 'insensitive' } },
                { description: { contains: q.search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(q.departmentId ? { departmentId: q.departmentId } : {}),
        ...createdAtRange(q),
      };
      const [data, total] = await Promise.all([
        prisma.process.findMany({ where, include, ...pageArgs(q), orderBy: { name: 'asc' } }),
        prisma.process.count({ where }),
      ]);
      return { data, total };
    },
    get: (id: string) => prisma.process.findUnique({ where: { id }, include }),
    create: (data: CreateProcessBody) => prisma.process.create({ data, include }),
    update: (id: string, data: UpdateProcessBody) =>
      prisma.process.update({ where: { id }, data, include }),
    remove: async (id: string) => {
      await prisma.process.delete({ where: { id } });
    },
  };
}
