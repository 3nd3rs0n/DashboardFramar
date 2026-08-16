import type { FastifyPluginAsync } from 'fastify';
import { crudController } from '../../lib/controller.js';
import { createTaskBody, listTasksQuery, updateTaskBody } from './schemas.js';
import { taskService } from './service.js';

export const taskRoutes: FastifyPluginAsync = async (app) => {
  crudController({
    app,
    entity: 'Task',
    tag: 'tasks',
    listQuery: listTasksQuery,
    createBody: createTaskBody,
    updateBody: updateTaskBody,
    service: taskService(app.prisma),
  });
};
