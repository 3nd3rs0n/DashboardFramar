import type { FastifyPluginAsync } from 'fastify';
import { dashboardController } from './controller.js';

export const dashboardRoutes: FastifyPluginAsync = async (app) => {
  dashboardController(app);
};
