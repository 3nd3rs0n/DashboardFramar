import { Prisma, type PrismaClient } from '@prisma/client';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export async function logAudit(
  prisma: PrismaClient,
  entry: { entity: string; entityId: string; action: AuditAction; userId?: string; changes?: unknown },
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      entity: entry.entity,
      entityId: entry.entityId,
      action: entry.action,
      userId: entry.userId ?? null,
      changes: entry.changes === undefined ? Prisma.JsonNull : (entry.changes as Prisma.InputJsonValue),
    },
  });
}
