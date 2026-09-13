import ExcelJS from 'exceljs';
import type { Prisma, PrismaClient } from '@prisma/client';
import { createdAtRange } from '../../lib/pagination.js';
import type { SummaryQuery } from './schemas.js';

function configureSheet(sheet: ExcelJS.Worksheet, columns: { header: string; key: string; width: number }[]) {
  sheet.columns = columns;
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } };
  sheet.getRow(1).alignment = { vertical: 'middle' };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + columns.length)}1` };
}

function formatDates(sheet: ExcelJS.Worksheet, keys: string[]) {
  for (const key of keys) {
    sheet.getColumn(key).numFmt = 'dd/mm/yyyy hh:mm';
  }
}

export async function buildDashboardExport(prisma: PrismaClient, q: SummaryQuery): Promise<Buffer> {
  const processScope: Prisma.ProcedureWhereInput = {
    ...(q.departmentId ? { process: { departmentId: q.departmentId } } : {}),
    ...createdAtRange(q),
  };
  const findingScope: Prisma.FindingWhereInput = {
    ...(q.departmentId ? { process: { departmentId: q.departmentId } } : {}),
    ...createdAtRange(q),
  };
  const taskScope: Prisma.TaskWhereInput = {
    ...(q.departmentId ? { departmentId: q.departmentId } : {}),
    ...createdAtRange(q),
  };

  const [procedures, findings, tasks] = await Promise.all([
    prisma.procedure.findMany({
      where: processScope,
      include: {
        process: { include: { department: true } },
        file: { select: { filename: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.finding.findMany({
      where: findingScope,
      include: {
        process: { include: { department: true } },
        file: { select: { filename: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.task.findMany({
      where: taskScope,
      include: { department: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Enterprise Audit Dashboard';
  workbook.created = new Date();

  const procedureSheet = workbook.addWorksheet('Procedimientos');
  configureSheet(procedureSheet, [
    { header: 'ID', key: 'id', width: 28 },
    { header: 'Código', key: 'code', width: 16 },
    { header: 'Título', key: 'title', width: 34 },
    { header: 'Contenido', key: 'content', width: 50 },
    { header: 'Versión', key: 'version', width: 12 },
    { header: 'Estado', key: 'status', width: 16 },
    { header: 'Proceso', key: 'process', width: 24 },
    { header: 'Departamento', key: 'department', width: 24 },
    { header: 'Archivo', key: 'file', width: 28 },
    { header: 'Creado', key: 'createdAt', width: 20 },
    { header: 'Actualizado', key: 'updatedAt', width: 20 },
  ]);
  procedureSheet.addRows(procedures.map((procedure) => ({
    id: procedure.id,
    code: procedure.code ?? '',
    title: procedure.title,
    content: procedure.content ?? '',
    version: procedure.version,
    status: procedure.status,
    process: procedure.process.name,
    department: procedure.process.department.name,
    file: procedure.file?.filename ?? '',
    createdAt: procedure.createdAt,
    updatedAt: procedure.updatedAt,
  })));
  formatDates(procedureSheet, ['createdAt', 'updatedAt']);

  const findingSheet = workbook.addWorksheet('Hallazgos');
  configureSheet(findingSheet, [
    { header: 'ID', key: 'id', width: 28 },
    { header: 'Código', key: 'code', width: 16 },
    { header: 'Título', key: 'title', width: 34 },
    { header: 'Tipo', key: 'type', width: 16 },
    { header: 'Prioridad', key: 'priority', width: 14 },
    { header: 'Estado', key: 'status', width: 22 },
    { header: 'Fecha vencimiento', key: 'dueDate', width: 20 },
    { header: 'Fecha cierre', key: 'closedAt', width: 20 },
    { header: 'Proceso', key: 'process', width: 24 },
    { header: 'Departamento', key: 'department', width: 24 },
    { header: 'Archivo', key: 'file', width: 28 },
    { header: 'Creado', key: 'createdAt', width: 20 },
    { header: 'Actualizado', key: 'updatedAt', width: 20 },
  ]);
  findingSheet.addRows(findings.map((finding) => ({
    id: finding.id,
    code: finding.code ?? '',
    title: finding.title,
    type: finding.type,
    priority: finding.priority,
    status: finding.status,
    dueDate: finding.dueDate ?? '',
    closedAt: finding.closedAt ?? '',
    process: finding.process.name,
    department: finding.process.department.name,
    file: finding.file?.filename ?? '',
    createdAt: finding.createdAt,
    updatedAt: finding.updatedAt,
  })));
  formatDates(findingSheet, ['dueDate', 'closedAt', 'createdAt', 'updatedAt']);

  const taskSheet = workbook.addWorksheet('Tareas');
  configureSheet(taskSheet, [
    { header: 'ID', key: 'id', width: 28 },
    { header: 'Título', key: 'title', width: 38 },
    { header: 'Estado', key: 'status', width: 18 },
    { header: 'Prioridad', key: 'priority', width: 14 },
    { header: 'Fecha vencimiento', key: 'dueDate', width: 20 },
    { header: 'Fecha completado', key: 'completedAt', width: 20 },
    { header: 'Departamento', key: 'department', width: 24 },
    { header: 'Responsable ID', key: 'responsibleId', width: 28 },
    { header: 'Creado', key: 'createdAt', width: 20 },
    { header: 'Actualizado', key: 'updatedAt', width: 20 },
  ]);
  taskSheet.addRows(tasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ?? '',
    completedAt: task.completedAt ?? '',
    department: task.department?.name ?? '',
    responsibleId: task.responsibleId ?? '',
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  })));
  formatDates(taskSheet, ['dueDate', 'completedAt', 'createdAt', 'updatedAt']);

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
