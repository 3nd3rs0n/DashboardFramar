import type { Prisma, PrismaClient } from '@prisma/client';
import { createdAtRange, pageArgs } from '../../lib/pagination.js';
import type { CreateActionBody, ListActionsQuery, UpdateActionBody } from './schemas.js';

const include = {
  finding: { select: { id: true, code: true, title: true, processId: true } },
  nonConformity: { select: { id: true, code: true, title: true, processId: true } },
  risk: { select: { id: true, title: true, processId: true } },
  opportunity: { select: { id: true, title: true, processId: true } },
} satisfies Prisma.ActionInclude;

/** Action has no process FK; scope it through its parent entity. */
export function actionProcessScope(
  processId?: string,
  departmentId?: string,
): Prisma.ActionWhereInput {
  if (processId) {
    return {
      OR: [
        { finding: { processId } },
        { nonConformity: { processId } },
        { risk: { processId } },
        { opportunity: { processId } },
      ],
    };
  }
  if (departmentId) {
    return {
      OR: [
        { finding: { process: { departmentId } } },
        { nonConformity: { process: { departmentId } } },
        { risk: { process: { departmentId } } },
        { opportunity: { process: { departmentId } } },
      ],
    };
  }
  return {};
}

export function actionService(prisma: PrismaClient) {
  return {
    async list(q: ListActionsQuery) {
      const where: Prisma.ActionWhereInput = {
        ...(q.search
          ? {
              OR: [
                { title: { contains: q.search, mode: 'insensitive' } },
                { description: { contains: q.search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...(q.status ? { status: q.status } : {}),
        ...(q.type ? { type: q.type } : {}),
        ...(q.responsibleId ? { responsibleId: q.responsibleId } : {}),
        ...actionProcessScope(q.processId, q.departmentId),
        ...createdAtRange(q),
      };
      const [data, total] = await Promise.all([
        prisma.action.findMany({ where, include, ...pageArgs(q), orderBy: { createdAt: 'desc' } }),
        prisma.action.count({ where }),
      ]);
      return { data, total };
    },
    get: (id: string) => prisma.action.findUnique({ where: { id }, include }),
    create: (data: CreateActionBody) => {
      if (!data.findingId && !data.nonConformityId && !data.riskId && !data.opportunityId) {
        throw new Error('An action must be linked to a finding, non-conformity, risk or opportunity');
      }
      return prisma.action.create({ data, include });
    },
    update: (id: string, data: UpdateActionBody) =>
      prisma.action.update({ where: { id }, data, include }),
    remove: async (id: string) => {
      await prisma.action.delete({ where: { id } });
    },
  };
}
