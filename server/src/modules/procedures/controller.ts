import type { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { idParamsSchema } from '../../lib/pagination.js';
import { createProcedureCommentBody } from './schemas.js';

async function procedureExists(app: FastifyInstance, id: string) {
  return app.prisma.procedure.findUnique({ where: { id }, select: { id: true } });
}

export function procedureHistoryController(app: FastifyInstance) {
  const a = app.withTypeProvider<ZodTypeProvider>();

  a.get('/:id/history', { schema: { params: idParamsSchema, tags: ['procedures'] } }, async (req, reply) => {
    const procedure = await procedureExists(app, req.params.id);
    if (!procedure) {
      return reply
        .code(404)
        .send({ statusCode: 404, error: 'Not Found', message: 'Procedure not found' });
    }

    return app.prisma.auditLog.findMany({
      where: { entity: 'Procedure', entityId: req.params.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  });

  a.get('/:id/comments', { schema: { params: idParamsSchema, tags: ['procedures'] } }, async (req, reply) => {
    const procedure = await procedureExists(app, req.params.id);
    if (!procedure) {
      return reply
        .code(404)
        .send({ statusCode: 404, error: 'Not Found', message: 'Procedure not found' });
    }

    return app.prisma.procedureComment.findMany({
      where: { procedureId: req.params.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
  });

  a.post(
    '/:id/comments',
    { schema: { params: idParamsSchema, body: createProcedureCommentBody, tags: ['procedures'] } },
    async (req, reply) => {
      const procedure = await procedureExists(app, req.params.id);
      if (!procedure) {
        return reply
          .code(404)
          .send({ statusCode: 404, error: 'Not Found', message: 'Procedure not found' });
      }

      const comment = await app.prisma.procedureComment.create({
        data: {
          body: req.body.body,
          procedureId: req.params.id,
          userId: req.user.sub,
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      return reply.code(201).send(comment);
    },
  );
}
