import type { FastifyPluginAsync } from 'fastify';
import { activityController } from './controller.js';

export const activityRoutes: FastifyPluginAsync = async (app) => {
  activityController(app);
};
