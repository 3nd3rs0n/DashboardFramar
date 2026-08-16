import type { FastifyInstance, FastifyRequest } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { fileService } from './service.js';

export function fileController(app: FastifyInstance) {
  const a = app.withTypeProvider<ZodTypeProvider>();
  const service = fileService(app.prisma);

  a.post(
    '/upload/:procedureId',
    {
      schema: {
        params: z.object({ procedureId: z.string().min(1) }),
        tags: ['files'],
      },
    },
    async (req, reply) => {
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
        req.params.procedureId,
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
    '/:procedureId',
    {
      schema: {
        params: z.object({ procedureId: z.string().min(1) }),
        tags: ['files'],
      },
    },
    async (req, reply) => {
      const file = await service.getByProcedureId(req.params.procedureId);
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
    '/:procedureId',
    {
      schema: {
        params: z.object({ procedureId: z.string().min(1) }),
        tags: ['files'],
      },
    },
    async (req, reply) => {
      const file = await service.getByProcedureId(req.params.procedureId);
      if (!file) {
        return reply.code(404).send({ statusCode: 404, error: 'Not Found', message: 'File not found' });
      }
      await service.delete(req.params.procedureId);
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
    '/download/:procedureId',
    {
      schema: {
        params: z.object({ procedureId: z.string().min(1) }),
        querystring: z.object({ token: z.string().optional() }),
        tags: ['files'],
        security: [],
      },
      preHandler: [tokenFromQuery, app.authenticate],
    },
    async (req, reply) => {
      const file = await service.getByProcedureId(req.params.procedureId);
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
    '/view/:procedureId',
    {
      schema: {
        params: z.object({ procedureId: z.string().min(1) }),
        querystring: z.object({ token: z.string().optional() }),
        tags: ['files'],
        security: [],
      },
      preHandler: [tokenFromQuery, app.authenticate],
    },
    async (req, reply) => {
      const file = await service.getByProcedureId(req.params.procedureId);
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
