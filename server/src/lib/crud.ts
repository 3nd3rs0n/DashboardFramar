import type { FastifyInstance, FastifyReply } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { z } from 'zod';
import { logAudit } from './audit.js';
import { idParamsSchema } from './pagination.js';
import { allowMutation } from './permissions.js';

export interface CrudService<TList, TCreate, TUpdate, TItem extends { id: string }> {
  list(query: TList): Promise<{ data: TItem[]; total: number }>;
  get(id: string): Promise<TItem | null>;
  create(data: TCreate): Promise<TItem>;
  update(id: string, data: TUpdate): Promise<TItem>;
  remove(id: string): Promise<void>;
}

function notFound(reply: FastifyReply, entity: string) {
  return reply
    .code(404)
    .send({ statusCode: 404, error: 'Not Found', message: `${entity} not found` });
}

// The type provider resolves req.query/body through a conditional that TS cannot reduce
// over generic schema params; the value IS the parsed schema output, so assert it here.
function parsed<S extends z.ZodType>(value: unknown): z.output<S> {
  return value as z.output<S>;
}

/** Registers the standard CRUD route set (list/get/create/update/delete) with audit logging. */
export function registerCrud<
  SQuery extends z.ZodType,
  SCreate extends z.ZodType,
  SUpdate extends z.ZodType,
  TItem extends { id: string },
>(
  app: FastifyInstance,
  opts: {
    entity: string;
    tag: string;
    listQuery: SQuery;
    createBody: SCreate;
    updateBody: SUpdate;
    service: CrudService<z.output<SQuery>, z.output<SCreate>, z.output<SUpdate>, TItem>;
  },
): void {
  const a = app.withTypeProvider<ZodTypeProvider>();
  const { entity, service } = opts;

  a.get('/', { schema: { querystring: opts.listQuery, tags: [opts.tag] } }, async (req) =>
    service.list(parsed<SQuery>(req.query)),
  );

  a.get('/:id', { schema: { params: idParamsSchema, tags: [opts.tag] } }, async (req, reply) => {
    const item = await service.get(req.params.id);
    if (!item) return notFound(reply, entity);
    return item;
  });

  a.post('/', { schema: { body: opts.createBody, tags: [opts.tag] } }, async (req, reply) => {
    if (!allowMutation(req, reply)) return;
    const item = await service.create(parsed<SCreate>(req.body));
    await logAudit(app.prisma, {
      entity,
      entityId: item.id,
      action: 'CREATE',
      userId: req.user.sub,
      changes: req.body,
    });
    return reply.code(201).send(item);
  });

  a.patch(
    '/:id',
    { schema: { params: idParamsSchema, body: opts.updateBody, tags: [opts.tag] } },
    async (req, reply) => {
      if (!allowMutation(req, reply)) return;
      if (!(await service.get(req.params.id))) return notFound(reply, entity);
      const item = await service.update(req.params.id, parsed<SUpdate>(req.body));
      await logAudit(app.prisma, {
        entity,
        entityId: item.id,
        action: 'UPDATE',
        userId: req.user.sub,
        changes: req.body,
      });
      return item;
    },
  );

  a.delete('/:id', { schema: { params: idParamsSchema, tags: [opts.tag] } }, async (req, reply) => {
    if (!allowMutation(req, reply)) return;
    if (!(await service.get(req.params.id))) return notFound(reply, entity);
    await service.remove(req.params.id);
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
