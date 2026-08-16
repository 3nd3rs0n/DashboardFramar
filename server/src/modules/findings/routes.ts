import type { FastifyPluginAsync } from 'fastify';
import { crudController } from '../../lib/controller.js';
import { createFindingBody, listFindingsQuery, updateFindingBody } from './schemas.js';
import { findingService } from './service.js';

export const findingRoutes: FastifyPluginAsync = async (app) => {
  crudController({
    app,
    entity: 'Finding',
    tag: 'findings',
    listQuery: listFindingsQuery,
    createBody: createFindingBody,
    updateBody: updateFindingBody,
    service: findingService(app.prisma),
  });
};
