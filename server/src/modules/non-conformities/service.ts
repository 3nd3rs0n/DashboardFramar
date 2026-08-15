import type { Prisma, PrismaClient } from '@prisma/client';
import { createdAtRange, pageArgs } from '../../lib/pagination.js';
import type {
  CreateNonConformityBody,
  ListNonConformitiesQuery,
  UpdateNonConformityBody,
} from './schemas.js';

const include = {
  process: { include: { department: true } },
} satisfies Prisma.NonConformityInclude;

export function nonConformityService(prisma: PrismaClient) {
  return {
    async list(q: ListNonConformitiesQuery) {
      const where: Prisma.NonConformityWhereInput = {
        ...(q.search
          ? {
              OR: [
                { title: { contains: q.search, mode: 'insensitive' } },
                { code: { contains: q.search, mode: 'insensitive' } },
                { requirement: { contains: q.search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(q.status ? { status: q.status } : {}),
        ...(q.processId ? { processId: q.processId } : {}),
        ...(q.departmentId ? { process: { departmentId: q.departmentId } } : {}),
        ...(q.responsibleId ? { responsibleId: q.responsibleId } : {}),
        ...createdAtRange(q),
      };
      const [data, total] = await Promise.all([
        prisma.nonConformity.findMany({
          where,
          include,
          ...pageArgs(q),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.nonConformity.count({ where }),
      ]);
      return { data, total };
    },
    get: (id: string) => prisma.nonConformity.findUnique({ where: { id }, include }),
    create: (data: CreateNonConformityBody) => prisma.nonConformity.create({ data, include }),
    update: (id: string, data: UpdateNonConformityBody) =>
      prisma.nonConformity.update({ where: { id }, data, include }),
    remove: async (id: string) => {
      await prisma.nonConformity.delete({ where: { id } });
    },
  };
}
