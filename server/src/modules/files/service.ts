import type { PrismaClient } from '@prisma/client';

type EntityType = 'procedure' | 'finding';

export function fileService(prisma: PrismaClient) {
  return {
    async upload(entityType: EntityType, entityId: string, filename: string, mimetype: string, size: number, data: Buffer) {
      const uint8Data = new Uint8Array(data);
      const where = entityType === 'procedure' ? { procedureId: entityId } : { findingId: entityId };
      const existing = await prisma.file.findUnique({ where });
      if (existing) {
        return prisma.file.update({
          where: { id: existing.id },
          data: { filename, mimetype, size, data: uint8Data },
        });
      }
      return prisma.file.create({
        data: {
          filename,
          mimetype,
          size,
          data: uint8Data,
          ...(entityType === 'procedure' ? { procedureId: entityId } : { findingId: entityId }),
        },
      });
    },

    getByEntity(entityType: EntityType, entityId: string) {
      const where = entityType === 'procedure' ? { procedureId: entityId } : { findingId: entityId };
      return prisma.file.findUnique({ where });
    },

    getById(id: string) {
      return prisma.file.findUnique({ where: { id } });
    },

    deleteByEntity(entityType: EntityType, entityId: string) {
      const where = entityType === 'procedure' ? { procedureId: entityId } : { findingId: entityId };
      return prisma.file.delete({ where });
    },
  };
}
