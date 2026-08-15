import type { FastifyPluginAsync } from 'fastify';
import { registerCrud } from '../../lib/crud.js';
import { createProcedureBody, listProceduresQuery, updateProcedureBody } from './schemas.js';
import { procedureService } from './service.js';

export const procedureRoutes: FastifyPluginAsync = async (app) => {
  registerCrud(app, {
    entity: 'Procedure',
    tag: 'procedures',
    listQuery: listProceduresQuery,
    createBody: createProcedureBody,
    updateBody: updateProcedureBody,
    service: procedureService(app.prisma),
  });
};
