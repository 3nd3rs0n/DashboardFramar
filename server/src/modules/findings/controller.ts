import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  addFindingParticipantBody,
  createFindingCommentBody,
  findingIdParams,
  findingParticipantParams,
} from './schemas.js';

function notFound(reply: FastifyReply, message: string) {
  return reply.code(404).send({ statusCode: 404, error: 'Not Found', message });
}

function forbidden(reply: FastifyReply) {
  return reply.code(403).send({
    statusCode: 403,
    error: 'Forbidden',
    message: 'Solo los participantes del hallazgo pueden acceder a esta colaboración',
  });
}

async function canAccessFinding(
  app: FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply,
  findingId: string,
): Promise<boolean> {
  const finding = await app.prisma.finding.findUnique({
    where: { id: findingId },
    select: {
      id: true,
      participants: {
        where: { userId: req.user.sub },
        select: { userId: true },
      },
    },
  });
  if (!finding) {
    notFound(reply, 'Finding not found');
    return false;
  }
  if (req.user.role !== 'ADMIN' && finding.participants.length === 0) {
    forbidden(reply);
    return false;
  }
  return true;
}

async function findingExists(app: FastifyInstance, findingId: string, reply: FastifyReply): Promise<boolean> {
  const finding = await app.prisma.finding.findUnique({ where: { id: findingId }, select: { id: true } });
  if (finding) return true;
  notFound(reply, 'Finding not found');
  return false;
}

export function findingCollaborationController(app: FastifyInstance) {
  const a = app.withTypeProvider<ZodTypeProvider>();

  a.get('/:id/history', { schema: { params: findingIdParams, tags: ['findings'] } }, async (req, reply) => {
    if (!(await canAccessFinding(app, req, reply, req.params.id))) return;
    return app.prisma.auditLog.findMany({
      where: { entity: 'Finding', entityId: req.params.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  });

  a.get('/:id/comments', { schema: { params: findingIdParams, tags: ['findings'] } }, async (req, reply) => {
    if (!(await canAccessFinding(app, req, reply, req.params.id))) return;
    return app.prisma.findingComment.findMany({
      where: { findingId: req.params.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });
  });

  a.post(
    '/:id/comments',
    { schema: { params: findingIdParams, body: createFindingCommentBody, tags: ['findings'] } },
    async (req, reply) => {
      if (!(await canAccessFinding(app, req, reply, req.params.id))) return;
      const comment = await app.prisma.findingComment.create({
        data: {
          body: req.body.body,
          findingId: req.params.id,
          userId: req.user.sub,
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      return reply.code(201).send(comment);
    },
  );

  a.get('/:id/participants', { schema: { params: findingIdParams, tags: ['findings'] } }, async (req, reply) => {
    if (!(await canAccessFinding(app, req, reply, req.params.id))) return;
    return app.prisma.findingParticipant.findMany({
      where: { findingId: req.params.id },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
  });

  a.post(
    '/:id/participants',
    { schema: { params: findingIdParams, body: addFindingParticipantBody, tags: ['findings'] } },
    async (req, reply) => {
      if (req.user.role !== 'ADMIN') return forbidden(reply);
      if (!(await findingExists(app, req.params.id, reply))) return;
      const user = await app.prisma.user.findUnique({ where: { id: req.body.userId }, select: { id: true } });
      if (!user) return notFound(reply, 'User not found');
      const participant = await app.prisma.findingParticipant.upsert({
        where: { findingId_userId: { findingId: req.params.id, userId: req.body.userId } },
        update: {},
        create: { findingId: req.params.id, userId: req.body.userId },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      });
      return reply.code(201).send(participant);
    },
  );

  a.delete(
    '/:id/participants/:userId',
    { schema: { params: findingParticipantParams, tags: ['findings'] } },
    async (req, reply) => {
      if (req.user.role !== 'ADMIN') return forbidden(reply);
      if (!(await findingExists(app, req.params.id, reply))) return;
      await app.prisma.findingParticipant.deleteMany({
        where: { findingId: req.params.id, userId: req.params.userId },
      });
      return reply.code(204).send();
    },
  );
}
