import type { FastifyPluginAsync } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { logAudit } from '../../lib/audit.js';
import { registerCrud } from '../../lib/crud.js';
import { idParamsSchema } from '../../lib/pagination.js';
import {
  createKpiBody,
  createKpiValueBody,
  kpiValueParamsSchema,
  listKpisQuery,
  listKpiValuesQuery,
  updateKpiBody,
} from './schemas.js';
import { kpiService } from './service.js';

export const kpiRoutes: FastifyPluginAsync = async (app) => {
  const service = kpiService(app.prisma);
  registerCrud(app, {
    entity: 'Kpi',
    tag: 'kpis',
    listQuery: listKpisQuery,
    createBody: createKpiBody,
    updateBody: updateKpiBody,
    service,
  });

  const a = app.withTypeProvider<ZodTypeProvider>();

  a.get(
    '/:id/values',
    { schema: { params: idParamsSchema, querystring: listKpiValuesQuery, tags: ['kpis'] } },
    async (req, reply) => {
      if (!(await service.get(req.params.id))) {
        return reply
          .code(404)
          .send({ statusCode: 404, error: 'Not Found', message: 'Kpi not found' });
      }
      return service.listValues(req.params.id, req.query);
    },
  );

  a.post(
    '/:id/values',
    { schema: { params: idParamsSchema, body: createKpiValueBody, tags: ['kpis'] } },
    async (req, reply) => {
      if (!(await service.get(req.params.id))) {
        return reply
          .code(404)
          .send({ statusCode: 404, error: 'Not Found', message: 'Kpi not found' });
      }
      const value = await service.upsertValue(req.params.id, req.body);
      await logAudit(app.prisma, {
        entity: 'KpiValue',
        entityId: value.id,
        action: 'CREATE',
        userId: req.user.sub,
        changes: { kpiId: req.params.id, ...req.body },
      });
      return reply.code(201).send(value);
    },
  );

  a.delete(
    '/:kpiId/values/:valueId',
    { schema: { params: kpiValueParamsSchema, tags: ['kpis'] } },
    async (req, reply) => {
      const existing = await service.getValue(req.params.valueId);
      if (!existing || existing.kpiId !== req.params.kpiId) {
        return reply
          .code(404)
          .send({ statusCode: 404, error: 'Not Found', message: 'KpiValue not found' });
      }
      await service.removeValue(req.params.kpiId, req.params.valueId);
      await logAudit(app.prisma, {
        entity: 'KpiValue',
        entityId: req.params.valueId,
        action: 'DELETE',
        userId: req.user.sub,
        changes: req.params,
      });
      return reply.code(204).send();
    },
  );
};
