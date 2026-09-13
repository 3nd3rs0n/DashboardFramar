import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { Prisma } from '@prisma/client';
import { logAudit } from './audit.js';
import { idParamsSchema } from './pagination.js';
import { allowMutation } from './permissions.js';
import type { CrudService } from './crud.js';
import type { z } from 'zod';

function parsed<S extends z.ZodType>(value: unknown): z.output<S> {
  return value as z.output<S>;
}

export function crudController<
  SQuery extends z.ZodType,
  SCreate extends z.ZodType,
  SUpdate extends z.ZodType,
  TItem extends { id: string },
>(opts: {
  app: FastifyInstance;
  entity: string;
  tag: string;
  listQuery: SQuery;
  createBody: SCreate;
  updateBody: SUpdate;
  service: CrudService<z.output<SQuery>, z.output<SCreate>, z.output<SUpdate>, TItem>;
  onCreate?: (item: TItem, userId: string) => Promise<void>;
  removeConflictMessage?: string;
}) {
  const { app, entity, tag, service } = opts;
  const a = app.withTypeProvider<ZodTypeProvider>();

  a.get('/', { schema: { querystring: opts.listQuery, tags: [tag] } }, async (req) =>
    service.list(parsed<SQuery>(req.query)),
  );

  a.get('/:id', { schema: { params: idParamsSchema, tags: [tag] } }, async (req, reply) => {
    const item = await service.get(req.params.id);
    if (!item) {
      return reply.code(404).send({ statusCode: 404, error: 'Not Found', message: `${entity} not found` });
    }
    return item;
  });

  a.post('/', { schema: { body: opts.createBody, tags: [tag] } }, async (req, reply) => {
    if (!allowMutation(req, reply)) return;
    const item = await service.create(parsed<SCreate>(req.body));
    await logAudit(app.prisma, {
      entity,
      entityId: item.id,
      action: 'CREATE',
      userId: req.user.sub,
      changes: req.body,
    });
    await opts.onCreate?.(item, req.user.sub);
    return reply.code(201).send(item);
  });

  a.patch('/:id', { schema: { params: idParamsSchema, body: opts.updateBody, tags: [tag] } }, async (req, reply) => {
    if (!allowMutation(req, reply)) return;
    if (!(await service.get(req.params.id))) {
      return reply.code(404).send({ statusCode: 404, error: 'Not Found', message: `${entity} not found` });
    }
    const item = await service.update(req.params.id, parsed<SUpdate>(req.body));
    await logAudit(app.prisma, {
      entity,
      entityId: item.id,
      action: 'UPDATE',
      userId: req.user.sub,
      changes: req.body,
    });
    return item;
  });

  a.delete('/:id', { schema: { params: idParamsSchema, tags: [tag] } }, async (req, reply) => {
    if (!allowMutation(req, reply)) return;
    if (!(await service.get(req.params.id))) {
      return reply.code(404).send({ statusCode: 404, error: 'Not Found', message: `${entity} not found` });
    }
    try {
      await service.remove(req.params.id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        return reply.code(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: opts.removeConflictMessage ?? 'No se puede eliminar porque existen registros relacionados.',
        });
      }
      throw error;
    }
    await logAudit(app.prisma, {
      entity,
      entityId: req.params.id,
      action: 'DELETE',
      userId: req.user.sub,
      changes: req.params,
    });
    return reply.code(204).send();
  });
}
