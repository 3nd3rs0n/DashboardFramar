import type { FastifyPluginAsync } from 'fastify';
import { kpiController } from './controller.js';

export const kpiRoutes: FastifyPluginAsync = async (app) => {
  kpiController(app);
};
