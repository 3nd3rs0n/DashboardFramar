import type { FastifyPluginAsync } from 'fastify';
import { bonusKpiController } from './controller.js';

export const bonusKpiRoutes: FastifyPluginAsync = async (app) => {
  bonusKpiController(app);
};
