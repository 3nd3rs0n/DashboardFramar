import type { Prisma, PrismaClient } from '@prisma/client';
import { createdAtRange, pageArgs } from '../../lib/pagination.js';
import type { CreateFindingBody, ListFindingsQuery, UpdateFindingBody } from './schemas.js';

const include = { process: { include: { department: true } } } satisfies Prisma.FindingInclude;

export function findingService(prisma: PrismaClient) {
  return {
    async list(q: ListFindingsQuery) {
      const where: Prisma.FindingWhereInput = {
        ...(q.search
          ? {
              OR: [
                { title: { contains: q.search, mode: 'insensitive' } },
                { code: { contains: q.search, mode: 'insensitive' } },
                { description: { contains: q.search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(q.status ? { status: q.status } : {}),
        ...(q.priority ? { priority: q.priority } : {}),
        ...(q.processId ? { processId: q.processId } : {}),
        ...(q.departmentId ? { process: { departmentId: q.departmentId } } : {}),
        ...(q.responsibleId ? { responsibleId: q.responsibleId } : {}),
        ...createdAtRange(q),
      };
      const [data, total] = await Promise.all([
        prisma.finding.findMany({ where, include, ...pageArgs(q), orderBy: { createdAt: 'desc' } }),
        prisma.finding.count({ where }),
      ]);
      return { data, total };
    },
    get: (id: string) => prisma.finding.findUnique({ where: { id }, include }),
    create: (data: CreateFindingBody) => prisma.finding.create({ data, include }),
    update: (id: string, data: UpdateFindingBody) =>
      prisma.finding.update({ where: { id }, data, include }),
    remove: async (id: string) => {
      await prisma.finding.delete({ where: { id } });
    },
  };
}
