import type { FastifyPluginAsync } from 'fastify';
import { fileController, filePublicController } from './controller.js';

export const fileRoutes: FastifyPluginAsync = async (app) => {
  fileController(app);
};

export const filePublicRoutes: FastifyPluginAsync = async (app) => {
  filePublicController(app);
};
