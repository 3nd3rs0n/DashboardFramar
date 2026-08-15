import type { Prisma, PrismaClient } from '@prisma/client';
import { createdAtRange, pageArgs } from '../../lib/pagination.js';
import type {
  CreateDepartmentBody,
  ListDepartmentsQuery,
  UpdateDepartmentBody,
} from './schemas.js';

export function departmentService(prisma: PrismaClient) {
  return {
    async list(q: ListDepartmentsQuery) {
      const where: Prisma.DepartmentWhereInput = {
        ...(q.search
          ? {
              OR: [
                { name: { contains: q.search, mode: 'insensitive' } },
                { description: { contains: q.search, mode: 'insensitive' } },
              ],
            }
          : {}),
        ...createdAtRange(q),
      };
      const [data, total] = await Promise.all([
        prisma.department.findMany({ where, ...pageArgs(q), orderBy: { name: 'asc' } }),
        prisma.department.count({ where }),
      ]);
      return { data, total };
    },
    get: (id: string) => prisma.department.findUnique({ where: { id } }),
    create: (data: CreateDepartmentBody) => prisma.department.create({ data }),
    update: (id: string, data: UpdateDepartmentBody) =>
      prisma.department.update({ where: { id }, data }),
    remove: async (id: string) => {
      await prisma.department.delete({ where: { id } });
    },
  };
}
