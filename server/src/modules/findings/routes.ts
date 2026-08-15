import type { FastifyPluginAsync } from 'fastify';
import { registerCrud } from '../../lib/crud.js';
import { createFindingBody, listFindingsQuery, updateFindingBody } from './schemas.js';
import { findingService } from './service.js';

export const findingRoutes: FastifyPluginAsync = async (app) => {
  registerCrud(app, {
    entity: 'Finding',
    tag: 'findings',
    listQuery: listFindingsQuery,
    createBody: createFindingBody,
    updateBody: updateFindingBody,
    service: findingService(app.prisma),
  });
};
