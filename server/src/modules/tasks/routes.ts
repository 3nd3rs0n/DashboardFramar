import type { FastifyPluginAsync } from 'fastify';
import { registerCrud } from '../../lib/crud.js';
import { createTaskBody, listTasksQuery, updateTaskBody } from './schemas.js';
import { taskService } from './service.js';

export const taskRoutes: FastifyPluginAsync = async (app) => {
  registerCrud(app, {
    entity: 'Task',
    tag: 'tasks',
    listQuery: listTasksQuery,
    createBody: createTaskBody,
    updateBody: updateTaskBody,
    service: taskService(app.prisma),
  });
};
