import type { FastifyPluginAsync } from 'fastify';
import { registerCrud } from '../../lib/crud.js';
import {
  createNonConformityBody,
  listNonConformitiesQuery,
  updateNonConformityBody,
} from './schemas.js';
import { nonConformityService } from './service.js';

export const nonConformityRoutes: FastifyPluginAsync = async (app) => {
  registerCrud(app, {
    entity: 'NonConformity',
    tag: 'non-conformities',
    listQuery: listNonConformitiesQuery,
    createBody: createNonConformityBody,
    updateBody: updateNonConformityBody,
    service: nonConformityService(app.prisma),
  });
};
