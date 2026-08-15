import type { FastifyPluginAsync } from 'fastify';
import { registerCrud } from '../../lib/crud.js';
import { createRiskBody, listRisksQuery, updateRiskBody } from './schemas.js';
import { riskService } from './service.js';

export const riskRoutes: FastifyPluginAsync = async (app) => {
  registerCrud(app, {
    entity: 'Risk',
    tag: 'risks',
    listQuery: listRisksQuery,
    createBody: createRiskBody,
    updateBody: updateRiskBody,
    service: riskService(app.prisma),
  });
};
