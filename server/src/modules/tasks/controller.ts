import type { FastifyInstance, FastifyReply } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createTaskCommentBody, taskIdParams } from './schemas.js';

function notFound(reply: FastifyReply) {
  return reply
    .code(404)
    .send({ statusCode: 404, error: 'Not Found', message: 'Task not found' });
}

export function taskCollaborationController(app: FastifyInstance) {
  const a = app.withTypeProvider<ZodTypeProvider>();

  a.get('/:id/history', { schema: { params: taskIdParams, tags: ['tasks'] } }, async (req, reply) => {
    const task = await app.prisma.task.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!task) return notFound(reply);

    return app.prisma.auditLog.findMany({
      where: { entity: 'Task', entityId: req.params.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  });

  a.get('/:id/comments', { schema: { params: taskIdParams, tags: ['tasks'] } }, async (req, reply) => {
    const task = await app.prisma.task.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!task) return notFound(reply);

    return app.prisma.taskComment.findMany({
      where: { taskId: req.params.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
  });

  a.post(
    '/:id/comments',
    { schema: { params: taskIdParams, body: createTaskCommentBody, tags: ['tasks'] } },
    async (req, reply) => {
      const task = await app.prisma.task.findUnique({ where: { id: req.params.id }, select: { id: true } });
      if (!task) return notFound(reply);

      const comment = await app.prisma.taskComment.create({
        data: {
          body: req.body.body,
          taskId: req.params.id,
          userId: req.user.sub,
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      return reply.code(201).send(comment);
    },
  );
}
