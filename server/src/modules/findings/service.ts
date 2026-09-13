import type { Prisma, PrismaClient } from '@prisma/client';
import { createdAtRange, pageArgs } from '../../lib/pagination.js';
import type { CreateFindingBody, ListFindingsQuery, UpdateFindingBody } from './schemas.js';

const include = {
  process: { include: { department: true } },
  file: true,
  comments: {
    where: { user: { role: { not: 'ADMIN' } } },
    select: { id: true },
    take: 1,
  },
} satisfies Prisma.FindingInclude;

async function nextFindingCode(prisma: PrismaClient): Promise<string> {
  const results = await prisma.$queryRaw<{ next: bigint }[]>`
    SELECT nextval('"finding_code_seq"') AS next
  `;
  const result = results[0];
  if (!result) throw new Error('No se pudo generar el código del hallazgo');
  return `H-${String(result.next).padStart(3, '0')}`;
}

export function findingService(prisma: PrismaClient) {
  return {
    async list(q: ListFindingsQuery) {
      const where: Prisma.FindingWhereInput = {
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
        ...(q.priority ? { priority: q.priority } : {}),
        ...(q.processId ? { processId: q.processId } : {}),
        ...(q.departmentId ? { process: { departmentId: q.departmentId } } : {}),
        ...createdAtRange(q),
      };
      const [data, total] = await Promise.all([
        prisma.finding.findMany({ where, include, ...pageArgs(q), orderBy: { createdAt: 'desc' } }),
        prisma.finding.count({ where }),
      ]);
      return { data, total };
    },
    get: (id: string) => prisma.finding.findUnique({ where: { id }, include }),
    async create(data: CreateFindingBody) {
      const { departmentId, processName, ...findingData } = data;
      const process = await prisma.process.upsert({
        where: {
          departmentId_name: {
            departmentId,
            name: processName,
          },
        },
        update: {},
        create: {
          name: processName,
          departmentId,
        },
      });
      const code = await nextFindingCode(prisma);
      return prisma.finding.create({
        data: { ...findingData, code, processId: process.id },
        include,
      });
    },
    async update(id: string, data: UpdateFindingBody) {
      const { departmentId, processName, ...findingData } = data;
      let processId: string | undefined;
      if (departmentId && processName) {
        const process = await prisma.process.upsert({
          where: {
            departmentId_name: {
              departmentId,
              name: processName,
            },
          },
          update: {},
          create: {
            name: processName,
            departmentId,
          },
        });
        processId = process.id;
      }
      return prisma.finding.update({
        where: { id },
        data: { ...findingData, ...(processId ? { processId } : {}) },
        include,
      });
    },
    remove: async (id: string) => {
      await prisma.finding.delete({ where: { id } });
    },
  };
}
