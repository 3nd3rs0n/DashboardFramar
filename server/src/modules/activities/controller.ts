import type { FastifyInstance, FastifyReply } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { logAudit } from '../../lib/audit.js';
import { idParamsSchema } from '../../lib/pagination.js';
import {
  createActivityBody,
  listActivitiesQuery,
  updateActivityBody,
} from './schemas.js';
import { activityService } from './service.js';

const notFound = (reply: FastifyReply) =>
  reply.code(404).send({ statusCode: 404, error: 'Not Found', message: 'Activity not found' });

export function activityController(app: FastifyInstance) {
  const a = app.withTypeProvider<ZodTypeProvider>();
  const service = activityService(app.prisma);

  a.get('/', { schema: { querystring: listActivitiesQuery, tags: ['activities'] } }, async (req) =>
    service.list(req.query),
  );

  a.get('/:id', { schema: { params: idParamsSchema, tags: ['activities'] } }, async (req, reply) => {
    const item = await service.get(req.params.id);
    if (!item) return notFound(reply);
    return item;
  });

  a.post('/', { schema: { body: createActivityBody, tags: ['activities'] } }, async (req, reply) => {
    const item = await service.create(req.body, req.user.sub);
    await logAudit(app.prisma, {
      entity: 'Activity',
      entityId: item.id,
      action: 'CREATE',
      userId: req.user.sub,
      changes: req.body,
    });
    return reply.code(201).send(item);
  });

  a.patch(
    '/:id',
    { schema: { params: idParamsSchema, body: updateActivityBody, tags: ['activities'] } },
    async (req, reply) => {
      if (!(await service.get(req.params.id))) return notFound(reply);
      const item = await service.update(req.params.id, req.body);
      await logAudit(app.prisma, {
        entity: 'Activity',
        entityId: item.id,
        action: 'UPDATE',
        userId: req.user.sub,
        changes: req.body,
      });
      return item;
    },
  );

  a.delete('/:id', { schema: { params: idParamsSchema, tags: ['activities'] } }, async (req, reply) => {
    if (!(await service.get(req.params.id))) return notFound(reply);
    await service.remove(req.params.id);
    await logAudit(app.prisma, {
      entity: 'Activity',
      entityId: req.params.id,
      action: 'DELETE',
      userId: req.user.sub,
      changes: req.params,
    });
    return reply.code(204).send();
  });
}
