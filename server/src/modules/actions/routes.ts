import type { FastifyPluginAsync } from 'fastify';
import { crudController } from '../../lib/controller.js';
import { createActionBody, listActionsQuery, updateActionBody } from './schemas.js';
import { actionService } from './service.js';

export const actionRoutes: FastifyPluginAsync = async (app) => {
  crudController({
    app,
    entity: 'Action',
    tag: 'actions',
    listQuery: listActionsQuery,
    createBody: createActionBody,
    updateBody: updateActionBody,
    service: actionService(app.prisma),
  });
};
