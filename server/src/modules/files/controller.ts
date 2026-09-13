import type { FastifyInstance, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { allowMutation } from '../../lib/permissions.js';
import { fileService } from './service.js';

const entityParamsSchema = z.object({
  entityType: z.enum(['procedure', 'finding']),
  entityId: z.string().min(1),
});

export function fileController(app: FastifyInstance) {
  const a = app.withTypeProvider<ZodTypeProvider>();
  const service = fileService(app.prisma);

  a.post(
    '/upload/:entityType/:entityId',
    {
      schema: {
        params: entityParamsSchema,
        tags: ['files'],
      },
    },
    async (req, reply) => {
      if (!allowMutation(req, reply)) return;
      const data = await req.file();
      if (!data) {
        return reply.code(400).send({ statusCode: 400, error: 'Bad Request', message: 'No file provided' });
      }

      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const fileBuffer = Buffer.concat(chunks);

      const file = await service.upload(
        req.params.entityType,
        req.params.entityId,
        data.filename,
        data.mimetype,
        fileBuffer.length,
        fileBuffer,
      );

      return reply.code(201).send({
        id: file.id,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        createdAt: file.createdAt,
      });
    },
  );

  a.get(
    '/:entityType/:entityId',
    {
      schema: {
        params: entityParamsSchema,
        tags: ['files'],
      },
    },
    async (req, reply) => {
      if (!allowMutation(req, reply)) return;
      const file = await service.getByEntity(req.params.entityType, req.params.entityId);
      if (!file) {
        return reply.code(404).send({ statusCode: 404, error: 'Not Found', message: 'File not found' });
      }
      return {
        id: file.id,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        createdAt: file.createdAt,
      };
    },
  );

  a.delete(
    '/:entityType/:entityId',
    {
      schema: {
        params: entityParamsSchema,
        tags: ['files'],
      },
    },
    async (req, reply) => {
      const file = await service.getByEntity(req.params.entityType, req.params.entityId);
      if (!file) {
        return reply.code(404).send({ statusCode: 404, error: 'Not Found', message: 'File not found' });
      }
      await service.deleteByEntity(req.params.entityType, req.params.entityId);
      return reply.code(204).send();
    },
  );
}

export function filePublicController(app: FastifyInstance) {
  const a = app.withTypeProvider<ZodTypeProvider>();
  const service = fileService(app.prisma);

  const tokenFromQuery = async (req: FastifyRequest) => {
    const token = (req.query as Record<string, string | undefined>).token;
    if (token) {
      req.headers.authorization = `Bearer ${token}`;
    }
  };

  a.get(
    '/download/:entityType/:entityId',
    {
      schema: {
        params: entityParamsSchema,
        querystring: z.object({ token: z.string().optional() }),
        tags: ['files'],
        security: [],
      },
      preHandler: [tokenFromQuery, app.authenticate],
    },
    async (req, reply) => {
      const file = await service.getByEntity(req.params.entityType, req.params.entityId);
      if (!file) {
        return reply.code(404).send({ statusCode: 404, error: 'Not Found', message: 'File not found' });
      }
      return reply
        .header('Content-Disposition', `attachment; filename="${file.filename}"`)
        .type(file.mimetype)
        .send(file.data);
    },
  );

  a.get(
    '/view/:entityType/:entityId',
    {
      schema: {
        params: entityParamsSchema,
        querystring: z.object({ token: z.string().optional() }),
        tags: ['files'],
        security: [],
      },
      preHandler: [tokenFromQuery, app.authenticate],
    },
    async (req, reply) => {
      const file = await service.getByEntity(req.params.entityType, req.params.entityId);
      if (!file) {
        return reply.code(404).send({ statusCode: 404, error: 'Not Found', message: 'File not found' });
      }
      return reply
        .header('Content-Disposition', `inline; filename="${file.filename}"`)
        .type(file.mimetype)
        .send(file.data);
    },
  );
}
