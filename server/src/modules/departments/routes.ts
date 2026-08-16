import type { FastifyPluginAsync } from 'fastify';
import { crudController } from '../../lib/controller.js';
import {
  createDepartmentBody,
  listDepartmentsQuery,
  updateDepartmentBody,
} from './schemas.js';
import { departmentService } from './service.js';

export const departmentRoutes: FastifyPluginAsync = async (app) => {
  crudController({
    app,
    entity: 'Department',
    tag: 'departments',
    listQuery: listDepartmentsQuery,
    createBody: createDepartmentBody,
    updateBody: updateDepartmentBody,
    service: departmentService(app.prisma),
  });
};
