import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { chartsQuery, summaryQuery } from './schemas.js';
import { dashboardService } from './service.js';
import { buildDashboardExport } from './export.js';

export function dashboardController(app: FastifyInstance) {
  const a = app.withTypeProvider<ZodTypeProvider>();
  const service = dashboardService(app.prisma);

  a.get('/summary', { schema: { querystring: summaryQuery, tags: ['dashboard'] } }, async (req) =>
    service.summary(req.query),
  );

  a.get('/charts', { schema: { querystring: chartsQuery, tags: ['dashboard'] } }, async (req) =>
    service.charts(req.query),
  );

  a.get('/export', { schema: { querystring: summaryQuery, tags: ['dashboard'] } }, async (req, reply) => {
    const workbook = await buildDashboardExport(app.prisma, req.query);
    return reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .header('Content-Disposition', `attachment; filename="dashboard-${new Date().toISOString().slice(0, 10)}.xlsx"`)
      .send(workbook);
  });
}
