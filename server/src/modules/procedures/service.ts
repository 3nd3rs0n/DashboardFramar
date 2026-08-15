import type { Prisma, PrismaClient } from '@prisma/client';
import { createdAtRange, pageArgs } from '../../lib/pagination.js';
import type {
  CreateProcedureBody,
  ListProceduresQuery,
  UpdateProcedureBody,
} from './schemas.js';

const include = { process: { include: { department: true } } } satisfies Prisma.ProcedureInclude;

export function procedureService(prisma: PrismaClient) {
  return {
    async list(q: ListProceduresQuery) {
      const where: Prisma.ProcedureWhereInput = {
        ...(q.search
          ? {
              OR: [
                { title: { contains: q.search, mode: 'insensitive' } },
                { code: { contains: q.search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(q.status ? { status: q.status } : {}),
        ...(q.processId ? { processId: q.processId } : {}),
        ...(q.departmentId ? { process: { departmentId: q.departmentId } } : {}),
        ...createdAtRange(q),
      };
      const [data, total] = await Promise.all([
        prisma.procedure.findMany({ where, include, ...pageArgs(q), orderBy: { createdAt: 'desc' } }),
        prisma.procedure.count({ where }),
      ]);
      return { data, total };
    },
    get: (id: string) => prisma.procedure.findUnique({ where: { id }, include }),
    create: (data: CreateProcedureBody) => prisma.procedure.create({ data, include }),
    update: (id: string, data: UpdateProcedureBody) =>
      prisma.procedure.update({ where: { id }, data, include }),
    remove: async (id: string) => {
      await prisma.procedure.delete({ where: { id } });
    },
  };
}
