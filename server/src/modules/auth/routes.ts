import type { FastifyPluginAsync } from 'fastify';
import { authController, authPublicController } from './controller.js';

/** Public auth routes (no JWT required). */
export const authPublicRoutes: FastifyPluginAsync = async (app) => {
  authPublicController(app);
};

/** Protected auth routes (JWT required; user management is ADMIN-only). */
export const authRoutes: FastifyPluginAsync = async (app) => {
  authController(app);
};
