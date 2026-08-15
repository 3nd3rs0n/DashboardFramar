import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { authPublicRoutes, authRoutes } from './modules/auth/routes.js';
import { actionRoutes } from './modules/actions/routes.js';
import { activityRoutes } from './modules/activities/routes.js';
import { dashboardRoutes } from './modules/dashboard/routes.js';
import { departmentRoutes } from './modules/departments/routes.js';
import { findingRoutes } from './modules/findings/routes.js';
import { kpiRoutes } from './modules/kpis/routes.js';
import { nonConformityRoutes } from './modules/non-conformities/routes.js';
import { opportunityRoutes } from './modules/opportunities/routes.js';
import { procedureRoutes } from './modules/procedures/routes.js';
import { processRoutes } from './modules/processes/routes.js';
import { riskRoutes } from './modules/risks/routes.js';
import { taskRoutes } from './modules/tasks/routes.js';
import authPlugin from './plugins/auth.js';
import prismaPlugin from './plugins/prisma.js';

export async function buildApp() {
  const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(cors, { origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' });
  await app.register(swagger, {
    openapi: {
      info: { title: 'Enterprise Audit Dashboard API', version: '1.0.0' },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });
  await app.register(prismaPlugin);
  await app.register(authPlugin);

  app.get(
    '/api/health',
    { schema: { tags: ['health'], security: [] } },
    async () => ({ status: 'ok' }),
  );

  await app.register(authPublicRoutes, { prefix: '/api/auth' });

  await app.register(
    async (api) => {
      api.addHook('onRequest', api.authenticate);
      await api.register(authRoutes, { prefix: '/auth' });
      await api.register(departmentRoutes, { prefix: '/departments' });
      await api.register(processRoutes, { prefix: '/processes' });
      await api.register(procedureRoutes, { prefix: '/procedures' });
      await api.register(findingRoutes, { prefix: '/findings' });
      await api.register(nonConformityRoutes, { prefix: '/non-conformities' });
      await api.register(riskRoutes, { prefix: '/risks' });
      await api.register(opportunityRoutes, { prefix: '/opportunities' });
      await api.register(actionRoutes, { prefix: '/actions' });
      await api.register(taskRoutes, { prefix: '/tasks' });
      await api.register(activityRoutes, { prefix: '/activities' });
      await api.register(kpiRoutes, { prefix: '/kpis' });
      await api.register(dashboardRoutes, { prefix: '/dashboard' });
    },
    { prefix: '/api' },
  );

  return app;
}
