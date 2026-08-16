import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { chartsQuery, summaryQuery } from './schemas.js';
import { dashboardService } from './service.js';

export function dashboardController(app: FastifyInstance) {
  const a = app.withTypeProvider<ZodTypeProvider>();
  const service = dashboardService(app.prisma);

  a.get('/summary', { schema: { querystring: summaryQuery, tags: ['dashboard'] } }, async (req) =>
    service.summary(req.query),
  );

  a.get('/charts', { schema: { querystring: chartsQuery, tags: ['dashboard'] } }, async (req) =>
    service.charts(req.query),
  );
}
