import type { Prisma, PrismaClient } from '@prisma/client';
import { createdAtRange, pageArgs } from '../../lib/pagination.js';
import type {
  CreateOpportunityBody,
  ListOpportunitiesQuery,
  UpdateOpportunityBody,
} from './schemas.js';

const include = {
  process: { include: { department: true } },
} satisfies Prisma.OpportunityInclude;

export function opportunityService(prisma: PrismaClient) {
  return {
    async list(q: ListOpportunitiesQuery) {
      const where: Prisma.OpportunityWhereInput = {
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
        prisma.opportunity.findMany({
          where,
          include,
          ...pageArgs(q),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.opportunity.count({ where }),
      ]);
      return { data, total };
    },
    get: (id: string) => prisma.opportunity.findUnique({ where: { id }, include }),
    create: (data: CreateOpportunityBody) => prisma.opportunity.create({ data, include }),
    update: (id: string, data: UpdateOpportunityBody) =>
      prisma.opportunity.update({ where: { id }, data, include }),
    remove: async (id: string) => {
      await prisma.opportunity.delete({ where: { id } });
    },
  };
}
