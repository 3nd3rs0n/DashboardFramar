import type { FastifyPluginAsync } from 'fastify';
import { registerCrud } from '../../lib/crud.js';
import {
  createOpportunityBody,
  listOpportunitiesQuery,
  updateOpportunityBody,
} from './schemas.js';
import { opportunityService } from './service.js';

export const opportunityRoutes: FastifyPluginAsync = async (app) => {
  registerCrud(app, {
    entity: 'Opportunity',
    tag: 'opportunities',
    listQuery: listOpportunitiesQuery,
    createBody: createOpportunityBody,
    updateBody: updateOpportunityBody,
    service: opportunityService(app.prisma),
  });
};
