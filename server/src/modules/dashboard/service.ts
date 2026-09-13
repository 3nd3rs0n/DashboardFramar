import type { Prisma, PrismaClient } from '@prisma/client';
import { createdAtRange } from '../../lib/pagination.js';
import type { ChartsQuery, SummaryQuery } from './schemas.js';

interface RelScope {
  processId?: string;
  process?: { departmentId: string };
  createdAt?: { gte?: Date; lte?: Date };
}

/** Shared scope fragment for entities related to a process (findings, tasks, kpis, ...). */
function relScope(q: SummaryQuery | ChartsQuery): RelScope {
  const s = q as SummaryQuery;
  return {
    ...(s.processId ? { processId: s.processId } : {}),
    ...(q.departmentId ? { process: { departmentId: q.departmentId } } : {}),
    ...createdAtRange(q),
  };
}

const OPEN_FINDING: Prisma.FindingWhereInput = { status: { not: 'CLOSED' } };
const PENDING_TASK: Prisma.TaskWhereInput = { status: { in: ['PENDING', 'IN_PROGRESS'] } };
const OPEN_TASK: Prisma.TaskWhereInput = { status: { notIn: ['DONE', 'CANCELLED'] } };

export function dashboardService(prisma: PrismaClient) {
  return {
    async summary(q: SummaryQuery) {
      const scope = relScope(q);
      const taskScope: Prisma.TaskWhereInput = {
        ...(q.departmentId ? { departmentId: q.departmentId } : {}),
        ...(q.responsibleId ? { responsibleId: q.responsibleId } : {}),
        ...createdAtRange(q),
      };
      const kpiScope: Prisma.KpiWhereInput = {
        ...scope,
      };
      const now = new Date();
      const procedureScope: Prisma.ProcedureWhereInput = {
        ...(q.processId ? { processId: q.processId } : {}),
        ...(q.departmentId ? { process: { departmentId: q.departmentId } } : {}),
        ...createdAtRange(q),
      };

      const [
        findingsTotal,
        findingsOpen,
        findingsOverdue,
        tasksTotal,
        tasksPending,
        tasksOverdue,
        proceduresTotal,
        proceduresApproved,
      ] = await Promise.all([
        prisma.finding.count({ where: scope }),
        prisma.finding.count({ where: { ...scope, ...OPEN_FINDING } }),
        prisma.finding.count({ where: { ...scope, ...OPEN_FINDING, dueDate: { lt: now } } }),
        prisma.task.count({ where: taskScope }),
        prisma.task.count({ where: { ...taskScope, ...PENDING_TASK } }),
        prisma.task.count({ where: { ...taskScope, ...OPEN_TASK, dueDate: { lt: now } } }),
        prisma.procedure.count({ where: procedureScope }),
        prisma.procedure.count({ where: { ...procedureScope, status: 'APPROVED' } }),
      ]);

      // offTarget assumes higher-is-better: latest value below target counts as off target
      const kpis = await prisma.kpi.findMany({
        where: kpiScope,
        select: { target: true, values: { orderBy: { date: 'desc' }, take: 1 } },
      });
      const offTarget = kpis.filter((k) => k.values[0] !== undefined && k.values[0].value < k.target).length;

      return {
        findings: { total: findingsTotal, open: findingsOpen, overdue: findingsOverdue },
        tasks: { total: tasksTotal, pending: tasksPending, overdue: tasksOverdue },
        procedures: { total: proceduresTotal, approved: proceduresApproved },
        kpis: { total: kpis.length, offTarget },
      };
    },

    async charts(q: ChartsQuery) {
      const scope = relScope(q);
      const taskScope: Prisma.TaskWhereInput = {
        ...(q.departmentId ? { departmentId: q.departmentId } : {}),
        ...createdAtRange(q),
      };
      const kpiScope: Prisma.KpiWhereInput = {
        ...scope,
      };
      const procedureScope: Prisma.ProcedureWhereInput = {
        ...(q.departmentId ? { process: { departmentId: q.departmentId } } : {}),
        ...createdAtRange(q),
      };

      // ponytail: bucket in JS; fine at dashboard scale, revisit with raw SQL groupBy if finding volume grows
      const findings = await prisma.finding.findMany({ where: scope, select: { createdAt: true } });
      const monthCounts = new Map<string, number>();
      for (const f of findings) {
        const month = f.createdAt.toISOString().slice(0, 7);
        monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
      }
      const findingsByMonth = [...monthCounts.entries()]
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month));

      const byProcess = await prisma.finding.groupBy({
        by: ['processId'],
        where: scope,
        _count: { _all: true },
      });
      const processes = await prisma.process.findMany({
        where: q.departmentId ? { departmentId: q.departmentId } : {},
        include: { department: true },
      });
      const deptOfProcess = new Map(processes.map((p) => [p.id, p.department.name]));
      const deptCounts = new Map<string, number>();
      for (const g of byProcess) {
        const dept = deptOfProcess.get(g.processId) ?? 'Unknown';
        deptCounts.set(dept, (deptCounts.get(dept) ?? 0) + g._count._all);
      }
      const findingsByDepartment = [...deptCounts.entries()]
        .map(([department, count]) => ({ department, count }))
        .sort((a, b) => b.count - a.count);

      const procedures = await prisma.procedure.findMany({
        where: procedureScope,
        select: { createdAt: true, status: true },
      });
      const procedureMonthCounts = new Map<string, { DRAFT: number; IN_REVIEW: number; APPROVED: number; OBSOLETE: number }>();
      for (const procedure of procedures) {
        const month = procedure.createdAt.toISOString().slice(0, 7);
        const counts = procedureMonthCounts.get(month) ?? { DRAFT: 0, IN_REVIEW: 0, APPROVED: 0, OBSOLETE: 0 };
        counts[procedure.status] += 1;
        procedureMonthCounts.set(month, counts);
      }
      const proceduresByMonth = [...procedureMonthCounts.entries()]
        .map(([month, counts]) => ({ month, ...counts }))
        .sort((a, b) => a.month.localeCompare(b.month));

      const taskGroups = await prisma.task.groupBy({
        by: ['status'],
        where: taskScope,
        _count: { _all: true },
      });
      const tasksByStatus = taskGroups.map((g) => ({ status: g.status, count: g._count._all }));

      const kpis = await prisma.kpi.findMany({
        where: kpiScope,
        select: { name: true, target: true, values: { orderBy: { date: 'desc' }, take: 1 } },
        orderBy: { name: 'asc' },
      });
      const kpiCompliance = kpis.map((k) => {
        const latest = k.values[0]?.value ?? null;
        return { kpi: k.name, target: k.target, latest, compliant: latest !== null && latest >= k.target };
      });

      return { findingsByMonth, findingsByDepartment, proceduresByMonth, tasksByStatus, kpiCompliance };
    },
  };
}
