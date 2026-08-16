import type { FastifyPluginAsync } from 'fastify';
import { crudController } from '../../lib/controller.js';
import {
  createOpportunityBody,
  listOpportunitiesQuery,
  updateOpportunityBody,
} from './schemas.js';
import { opportunityService } from './service.js';

export const opportunityRoutes: FastifyPluginAsync = async (app) => {
  crudController({
    app,
    entity: 'Opportunity',
    tag: 'opportunities',
    listQuery: listOpportunitiesQuery,
    createBody: createOpportunityBody,
    updateBody: updateOpportunityBody,
    service: opportunityService(app.prisma),
  });
};
