import type { FastifyPluginAsync } from 'fastify';
import { crudController } from '../../lib/controller.js';
import {
  createNonConformityBody,
  listNonConformitiesQuery,
  updateNonConformityBody,
} from './schemas.js';
import { nonConformityService } from './service.js';

export const nonConformityRoutes: FastifyPluginAsync = async (app) => {
  crudController({
    app,
    entity: 'NonConformity',
    tag: 'non-conformities',
    listQuery: listNonConformitiesQuery,
    createBody: createNonConformityBody,
    updateBody: updateNonConformityBody,
    service: nonConformityService(app.prisma),
  });
};
