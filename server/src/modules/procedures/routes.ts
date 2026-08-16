import type { FastifyPluginAsync } from 'fastify';
import { crudController } from '../../lib/controller.js';
import { createProcedureBody, listProceduresQuery, updateProcedureBody } from './schemas.js';
import { procedureService } from './service.js';

export const procedureRoutes: FastifyPluginAsync = async (app) => {
  crudController({
    app,
    entity: 'Procedure',
    tag: 'procedures',
    listQuery: listProceduresQuery,
    createBody: createProcedureBody,
    updateBody: updateProcedureBody,
    service: procedureService(app.prisma),
  });
};
