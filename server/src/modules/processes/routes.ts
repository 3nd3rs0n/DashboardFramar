import type { FastifyPluginAsync } from 'fastify';
import { registerCrud } from '../../lib/crud.js';
import { createProcessBody, listProcessesQuery, updateProcessBody } from './schemas.js';
import { processService } from './service.js';

export const processRoutes: FastifyPluginAsync = async (app) => {
  registerCrud(app, {
    entity: 'Process',
    tag: 'processes',
    listQuery: listProcessesQuery,
    createBody: createProcessBody,
    updateBody: updateProcessBody,
    service: processService(app.prisma),
  });
};
