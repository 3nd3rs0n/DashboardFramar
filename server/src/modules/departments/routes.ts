import type { FastifyPluginAsync } from 'fastify';
import { registerCrud } from '../../lib/crud.js';
import {
  createDepartmentBody,
  listDepartmentsQuery,
  updateDepartmentBody,
} from './schemas.js';
import { departmentService } from './service.js';

export const departmentRoutes: FastifyPluginAsync = async (app) => {
  registerCrud(app, {
    entity: 'Department',
    tag: 'departments',
    listQuery: listDepartmentsQuery,
    createBody: createDepartmentBody,
    updateBody: updateDepartmentBody,
    service: departmentService(app.prisma),
  });
};
