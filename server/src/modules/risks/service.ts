import type { Prisma, PrismaClient } from '@prisma/client';
import { createdAtRange, pageArgs } from '../../lib/pagination.js';
import type { CreateRiskBody, ListRisksQuery, UpdateRiskBody } from './schemas.js';

const include = { process: { include: { department: true } } } satisfies Prisma.RiskInclude;

export function riskService(prisma: PrismaClient) {
  return {
    async list(q: ListRisksQuery) {
      const where: Prisma.RiskWhereInput = {
        ...(q.search
          ? {
              OR: [
                { title: { contains: q.search, mode: 'insensitive' } },
                { description: { contains: q.search, mode: 'insensitive' } },
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
        prisma.risk.findMany({ where, include, ...pageArgs(q), orderBy: { level: 'desc' } }),
        prisma.risk.count({ where }),
      ]);
      return { data, total };
    },
    get: (id: string) => prisma.risk.findUnique({ where: { id }, include }),
    create: (data: CreateRiskBody) =>
      prisma.risk.create({
        // level defaults to probability x impact when not provided
        data: { ...data, level: data.level ?? data.probability * data.impact },
        include,
      }),
    update: (id: string, data: UpdateRiskBody) =>
      prisma.risk.update({ where: { id }, data, include }),
    remove: async (id: string) => {
      await prisma.risk.delete({ where: { id } });
    },
  };
}
