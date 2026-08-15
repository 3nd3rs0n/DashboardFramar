import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { logAudit } from '../../lib/audit.js';
import { createUserBody, loginBody } from './schemas.js';
import { authService, publicUser } from './service.js';

/** Public auth routes (no JWT required). */
export const authPublicRoutes: FastifyPluginAsync = async (app) => {
  const a = app.withTypeProvider<ZodTypeProvider>();
  const service = authService(app.prisma);

  a.post(
    '/login',
    { schema: { body: loginBody, tags: ['auth'], security: [] } },
    async (req, reply) => {
      const user = await service.findByEmail(req.body.email);
      if (!user || !(await service.verify(req.body.password, user.passwordHash))) {
        return reply
          .code(401)
          .send({ statusCode: 401, error: 'Unauthorized', message: 'Invalid credentials' });
      }
      const token = app.jwt.sign({ sub: user.id, role: user.role });
      return { token, user: publicUser(user) };
    },
  );
};

/** Protected auth routes (JWT required; user management is ADMIN-only). */
export const authRoutes: FastifyPluginAsync = async (app) => {
  const a = app.withTypeProvider<ZodTypeProvider>();
  const service = authService(app.prisma);

  const requireAdmin = async (req: FastifyRequest, reply: FastifyReply) => {
    if (req.user.role !== 'ADMIN') {
      return reply
        .code(403)
        .send({ statusCode: 403, error: 'Forbidden', message: 'Admin role required' });
    }
  };

  a.get('/me', { schema: { tags: ['auth'] } }, async (req, reply) => {
    const user = await service.findById(req.user.sub);
    if (!user) {
      return reply
        .code(404)
        .send({ statusCode: 404, error: 'Not Found', message: 'User not found' });
    }
    return publicUser(user);
  });

  a.post(
    '/users',
    { schema: { body: createUserBody, tags: ['auth'] }, preHandler: requireAdmin },
    async (req, reply) => {
      const user = await service.create(req.body);
      await logAudit(app.prisma, {
        entity: 'User',
        entityId: user.id,
        action: 'CREATE',
        userId: req.user.sub,
        changes: { email: req.body.email, name: req.body.name, role: req.body.role },
      });
      return reply.code(201).send(user);
    },
  );

  a.get('/users', { schema: { tags: ['auth'] }, preHandler: requireAdmin }, async () =>
    service.list(),
  );
};
