import type { FastifyPluginAsync } from 'fastify';
import { crudController } from '../../lib/controller.js';
import { createProcessBody, listProcessesQuery, updateProcessBody } from './schemas.js';
import { processService } from './service.js';

export const processRoutes: FastifyPluginAsync = async (app) => {
  crudController({
    app,
    entity: 'Process',
    tag: 'processes',
    listQuery: listProcessesQuery,
    createBody: createProcessBody,
    updateBody: updateProcessBody,
    service: processService(app.prisma),
  });
};
