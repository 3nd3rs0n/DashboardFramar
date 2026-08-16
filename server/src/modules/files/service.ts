import type { PrismaClient } from '@prisma/client';

export function fileService(prisma: PrismaClient) {
  return {
    async upload(procedureId: string, filename: string, mimetype: string, size: number, data: Buffer) {
      const uint8Data = new Uint8Array(data);
      const existing = await prisma.file.findUnique({ where: { procedureId } });
      if (existing) {
        return prisma.file.update({
          where: { procedureId },
          data: { filename, mimetype, size, data: uint8Data },
        });
      }
      return prisma.file.create({
        data: { procedureId, filename, mimetype, size, data: uint8Data },
      });
    },

    getByProcedureId(procedureId: string) {
      return prisma.file.findUnique({ where: { procedureId } });
    },

    getById(id: string) {
      return prisma.file.findUnique({ where: { id } });
    },

    delete(procedureId: string) {
      return prisma.file.delete({ where: { procedureId } });
    },
  };
}
