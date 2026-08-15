import type { Prisma, PrismaClient } from '@prisma/client';
import { createdAtRange, pageArgs } from '../../lib/pagination.js';
import type {
  CreateKpiBody,
  CreateKpiValueBody,
  ListKpisQuery,
  ListKpiValuesQuery,
  UpdateKpiBody,
} from './schemas.js';

const include = { process: { include: { department: true } } } satisfies Prisma.KpiInclude;

export function kpiService(prisma: PrismaClient) {
  return {
    async list(q: ListKpisQuery) {
      const where: Prisma.KpiWhereInput = {
        ...(q.search
          ? {
              OR: [
                { name: { contains: q.search, mode: 'insensitive' } },
                { description: { contains: q.search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(q.frequency ? { frequency: q.frequency } : {}),
        ...(q.processId ? { processId: q.processId } : {}),
        ...(q.departmentId ? { process: { departmentId: q.departmentId } } : {}),
        ...(q.responsibleId ? { responsibleId: q.responsibleId } : {}),
        ...createdAtRange(q),
      };
      const [data, total] = await Promise.all([
        prisma.kpi.findMany({ where, include, ...pageArgs(q), orderBy: { name: 'asc' } }),
        prisma.kpi.count({ where }),
      ]);
      return { data, total };
    },
    get: (id: string) => prisma.kpi.findUnique({ where: { id }, include }),
    create: (data: CreateKpiBody) => prisma.kpi.create({ data, include }),
    update: (id: string, data: UpdateKpiBody) =>
      prisma.kpi.update({ where: { id }, data, include }),
    remove: async (id: string) => {
      await prisma.kpi.delete({ where: { id } });
    },

    async listValues(kpiId: string, q: ListKpiValuesQuery) {
      const where: Prisma.KpiValueWhereInput = { kpiId };
      const [data, total] = await Promise.all([
        prisma.kpiValue.findMany({ where, ...pageArgs(q), orderBy: { date: 'desc' } }),
        prisma.kpiValue.count({ where }),
      ]);
      return { data, total };
    },
    // upsert on (kpiId, period): one value per period per KPI
    upsertValue: (kpiId: string, data: CreateKpiValueBody) =>
      prisma.kpiValue.upsert({
        where: { kpiId_period: { kpiId, period: data.period } },
        create: { ...data, kpiId },
        update: { value: data.value, ...(data.date ? { date: data.date } : {}) },
      }),
    getValue: (valueId: string) => prisma.kpiValue.findUnique({ where: { id: valueId } }),
    removeValue: async (kpiId: string, valueId: string) => {
      await prisma.kpiValue.delete({ where: { id: valueId, kpiId } });
    },
  };
}
