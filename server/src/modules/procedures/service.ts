import type { Prisma, PrismaClient } from '@prisma/client';
import { createdAtRange, pageArgs } from '../../lib/pagination.js';
import type {
  CreateProcedureBody,
  ListProceduresQuery,
  UpdateProcedureBody,
} from './schemas.js';

const include = {
  process: { include: { department: true } },
  file: { select: { id: true, filename: true, mimetype: true, size: true, createdAt: true } },
  comments: {
    where: { user: { role: { not: 'ADMIN' } } },
    select: { id: true },
    take: 1,
  },
} satisfies Prisma.ProcedureInclude;

async function findOrCreateProcess(
  prisma: PrismaClient,
  departmentId: string,
  processName: string,
) {
  const existing = await prisma.process.findFirst({
    where: { departmentId, name: processName },
  });
  if (existing) return existing;
  return prisma.process.create({
    data: { name: processName, departmentId },
  });
}

export function procedureService(prisma: PrismaClient) {
  return {
    async list(q: ListProceduresQuery) {
      const where: Prisma.ProcedureWhereInput = {
        ...(q.search
          ? {
              OR: [
                { title: { contains: q.search, mode: 'insensitive' } },
                { code: { contains: q.search, mode: 'insensitive' } },
                { process: { name: { contains: q.search, mode: 'insensitive' } } },
                { process: { department: { name: { contains: q.search, mode: 'insensitive' } } } },
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
    async create(data: CreateProcedureBody) {
      const process = await findOrCreateProcess(prisma, data.departmentId, data.processName);
      return prisma.procedure.create({
        data: {
          code: data.code,
           title: data.title,
           content: data.content,
           version: data.version,
           status: data.status,
           dueDate: data.dueDate,
           processId: process.id,
        },
        include,
      });
    },
    async update(id: string, data: UpdateProcedureBody) {
      const existing = await prisma.procedure.findUnique({ where: { id } });
      if (!existing) throw new Error('Procedure not found');

      let processId = existing.processId;
      if (data.departmentId && data.processName) {
        const process = await findOrCreateProcess(prisma, data.departmentId, data.processName);
        processId = process.id;
      } else if (data.processName) {
        const current = await prisma.process.findUnique({ where: { id: existing.processId } });
        if (current && data.processName !== current.name) {
          const process = await findOrCreateProcess(prisma, current.departmentId, data.processName);
          processId = process.id;
        }
      }

      return prisma.procedure.update({
        where: { id },
        data: {
          ...(data.code !== undefined ? { code: data.code } : {}),
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.content !== undefined ? { content: data.content } : {}),
          ...(data.version !== undefined ? { version: data.version } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.dueDate !== undefined ? { dueDate: data.dueDate } : {}),
          processId,
        },
        include,
      });
    },
    remove: async (id: string) => {
      await prisma.procedure.delete({ where: { id } });
    },
  };
}
