import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { logAudit } from '../../lib/audit.js';
import { allowMutation } from '../../lib/permissions.js';
import {
  bonusActionBody,
  bonusActionsQuery,
  bonusConfigBody,
  bonusConfigKeyParams,
  bonusFindingBody,
  bonusFindingsQuery,
  bonusHistoryParams,
  bonusPeriodQuery,
  bonusProcedureBody,
  bonusProceduresQuery,
  bonusRecordParams,
} from './schemas.js';
import { bonusKpiService } from './service.js';

function notFound(reply: FastifyReply, message: string) {
  return reply.code(404).send({ statusCode: 404, error: 'Not Found', message });
}

async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  if (req.user.role !== 'ADMIN') {
    return reply.code(403).send({ statusCode: 403, error: 'Forbidden', message: 'Admin role required' });
  }
}

async function requireEditor(req: FastifyRequest, reply: FastifyReply) {
  if (!allowMutation(req, reply)) return;
}

export function bonusKpiController(app: FastifyInstance) {
  const a = app.withTypeProvider<ZodTypeProvider>();
  const service = bonusKpiService(app.prisma);

  a.get('/dashboard', { schema: { querystring: bonusPeriodQuery, tags: ['bonus-kpis'] } }, async (req) =>
    service.dashboard(req.query),
  );

  a.get('/config', { schema: { tags: ['bonus-kpis'] } }, async () => service.configs());
  a.patch(
    '/config/:key',
    { schema: { params: bonusConfigKeyParams, body: bonusConfigBody, tags: ['bonus-kpis'] }, preHandler: requireAdmin },
    async (req, reply) => {
      const config = await service.updateConfig(req.params.key, req.body);
      if (!config) return notFound(reply, 'Bonus KPI configuration not found');
      await logAudit(app.prisma, {
        entity: 'BonusKpiConfig',
        entityId: config.id,
        action: 'UPDATE',
        userId: req.user.sub,
        changes: req.body,
      });
      return config;
    },
  );

  a.get('/findings', { schema: { querystring: bonusFindingsQuery, tags: ['bonus-kpis'] } }, async (req) =>
    service.listFindings(req.query),
  );
  a.get('/findings/:id', { schema: { params: bonusRecordParams, tags: ['bonus-kpis'] } }, async (req, reply) => {
    const item = await service.getFinding(req.params.id);
    return item ?? notFound(reply, 'Bonus finding not found');
  });
  a.post('/findings', { schema: { body: bonusFindingBody, tags: ['bonus-kpis'] }, preHandler: requireEditor }, async (req, reply) => {
    const item = await service.createFinding(req.body);
    await logAudit(app.prisma, { entity: 'BonusFinding', entityId: item.id, action: 'CREATE', userId: req.user.sub, changes: req.body });
    return reply.code(201).send(item);
  });
  a.patch('/findings/:id', { schema: { params: bonusRecordParams, body: bonusFindingBody.partial(), tags: ['bonus-kpis'] }, preHandler: requireEditor }, async (req, reply) => {
    if (!(await service.getFinding(req.params.id))) return notFound(reply, 'Bonus finding not found');
    const item = await service.updateFinding(req.params.id, req.body);
    await logAudit(app.prisma, { entity: 'BonusFinding', entityId: item.id, action: 'UPDATE', userId: req.user.sub, changes: req.body });
    return item;
  });
  a.delete('/findings/:id', { schema: { params: bonusRecordParams, tags: ['bonus-kpis'] }, preHandler: requireEditor }, async (req, reply) => {
    if (!(await service.getFinding(req.params.id))) return notFound(reply, 'Bonus finding not found');
    await service.removeFinding(req.params.id);
    await logAudit(app.prisma, { entity: 'BonusFinding', entityId: req.params.id, action: 'DELETE', userId: req.user.sub, changes: req.params });
    return reply.code(204).send();
  });

  a.get('/actions', { schema: { querystring: bonusActionsQuery, tags: ['bonus-kpis'] } }, async (req) =>
    service.listActions(req.query),
  );
  a.get('/actions/:id', { schema: { params: bonusRecordParams, tags: ['bonus-kpis'] } }, async (req, reply) => {
    const item = await service.getAction(req.params.id);
    return item ?? notFound(reply, 'Bonus improvement action not found');
  });
  a.post('/actions', { schema: { body: bonusActionBody, tags: ['bonus-kpis'] }, preHandler: requireEditor }, async (req, reply) => {
    const item = await service.createAction(req.body, req.user.sub);
    await logAudit(app.prisma, { entity: 'BonusImprovementAction', entityId: item.id, action: 'CREATE', userId: req.user.sub, changes: req.body });
    return reply.code(201).send(item);
  });
  a.patch('/actions/:id', { schema: { params: bonusRecordParams, body: bonusActionBody.partial(), tags: ['bonus-kpis'] }, preHandler: requireEditor }, async (req, reply) => {
    if (!(await service.getAction(req.params.id))) return notFound(reply, 'Bonus improvement action not found');
    const item = await service.updateAction(req.params.id, req.body, req.user.sub);
    await logAudit(app.prisma, { entity: 'BonusImprovementAction', entityId: item.id, action: 'UPDATE', userId: req.user.sub, changes: req.body });
    return item;
  });
  a.delete('/actions/:id', { schema: { params: bonusRecordParams, tags: ['bonus-kpis'] }, preHandler: requireEditor }, async (req, reply) => {
    if (!(await service.getAction(req.params.id))) return notFound(reply, 'Bonus improvement action not found');
    await service.removeAction(req.params.id);
    await logAudit(app.prisma, { entity: 'BonusImprovementAction', entityId: req.params.id, action: 'DELETE', userId: req.user.sub, changes: req.params });
    return reply.code(204).send();
  });

  a.get('/procedures', { schema: { querystring: bonusProceduresQuery, tags: ['bonus-kpis'] } }, async (req) =>
    service.listProcedures(req.query),
  );
  a.get('/procedures/:id', { schema: { params: bonusRecordParams, tags: ['bonus-kpis'] } }, async (req, reply) => {
    const item = await service.getProcedure(req.params.id);
    return item ?? notFound(reply, 'Bonus procedure not found');
  });
  a.post('/procedures', { schema: { body: bonusProcedureBody, tags: ['bonus-kpis'] }, preHandler: requireEditor }, async (req, reply) => {
    const item = await service.createProcedure(req.body);
    await logAudit(app.prisma, { entity: 'BonusProcedure', entityId: item.id, action: 'CREATE', userId: req.user.sub, changes: req.body });
    return reply.code(201).send(item);
  });
  a.patch('/procedures/:id', { schema: { params: bonusRecordParams, body: bonusProcedureBody.partial(), tags: ['bonus-kpis'] }, preHandler: requireEditor }, async (req, reply) => {
    if (!(await service.getProcedure(req.params.id))) return notFound(reply, 'Bonus procedure not found');
    const item = await service.updateProcedure(req.params.id, req.body);
    await logAudit(app.prisma, { entity: 'BonusProcedure', entityId: item.id, action: 'UPDATE', userId: req.user.sub, changes: req.body });
    return item;
  });
  a.delete('/procedures/:id', { schema: { params: bonusRecordParams, tags: ['bonus-kpis'] }, preHandler: requireEditor }, async (req, reply) => {
    if (!(await service.getProcedure(req.params.id))) return notFound(reply, 'Bonus procedure not found');
    await service.removeProcedure(req.params.id);
    await logAudit(app.prisma, { entity: 'BonusProcedure', entityId: req.params.id, action: 'DELETE', userId: req.user.sub, changes: req.params });
    return reply.code(204).send();
  });

  a.get('/:entity/:id/history', { schema: { params: bonusHistoryParams, tags: ['bonus-kpis'] } }, async (req) => {
    const entity = {
      finding: 'BonusFinding',
      action: 'BonusImprovementAction',
      procedure: 'BonusProcedure',
    }[req.params.entity];
    return service.history(entity, req.params.id);
  });
}
