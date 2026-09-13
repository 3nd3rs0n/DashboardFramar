import type { FastifyReply, FastifyRequest } from 'fastify';

export function allowMutation(req: FastifyRequest, reply: FastifyReply): boolean {
  if (req.user.role !== 'VIEWER') return true;
  reply.code(403).send({
    statusCode: 403,
    error: 'Forbidden',
    message: 'Este usuario tiene acceso de lectura y comentarios, pero no puede modificar información.',
  });
  return false;
}
