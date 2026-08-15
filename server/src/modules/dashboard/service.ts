import type { Prisma, PrismaClient } from '@prisma/client';
import { createdAtRange } from '../../lib/pagination.js';
import { actionProcessScope } from '../actions/service.js';
import type { ChartsQuery, SummaryQuery } from './schemas.js';

interface RelScope {
  processId?: string;
  process?: { departmentId: string };
  responsibleId?: string;
  createdAt?: { gte?: Date; lte?: Date };
}

/** Shared scope fragment for entities related to a process (findings, risks, tasks, kpis, ...). */
function relScope(q: SummaryQuery | ChartsQuery): RelScope {
  const s = q as SummaryQuery;
  return {
    ...(s.processId ? { processId: s.processId } : {}),
    ...(q.departmentId ? { process: { departmentId: q.departmentId } } : {}),
    ...(s.responsibleId ? { responsibleId: s.responsibleId } : {}),
    ...createdAtRange(q),
  };
}

const OPEN_FINDING: Prisma.FindingWhereInput = { status: { not: 'CLOSED' } };
const OPEN_NC: Prisma.NonConformityWhereInput = { status: { not: 'CLOSED' } };
const PENDING_ACTION: Prisma.ActionWhereInput = { status: { in: ['PENDING', 'IN_PROGRESS'] } };
const OPEN_ACTION: Prisma.ActionWhereInput = { status: { notIn: ['DONE', 'VERIFIED', 'CANCELLED'] } };
const PENDING_TASK: Prisma.TaskWhereInput = { status: { in: ['PENDING', 'IN_PROGRESS'] } };
const OPEN_TASK: Prisma.TaskWhereInput = { status: { notIn: ['DONE', 'CANCELLED'] } };
const ACTIVE_RISK: Prisma.RiskWhereInput = { status: { not: 'CLOSED' } };
const OPEN_OPPORTUNITY: Prisma.OpportunityWhereInput = { status: { not: 'CLOSED' } };

export function dashboardService(prisma: PrismaClient) {
  return {
    async summary(q: SummaryQuery) {
      const scope = relScope(q);
      const now = new Date();
      const actionScope: Prisma.ActionWhereInput = {
        ...(q.responsibleId ? { responsibleId: q.responsibleId } : {}),
        ...actionProcessScope(q.processId, q.departmentId),
        ...createdAtRange(q),
      };
      const procedureScope: Prisma.ProcedureWhereInput = {
        ...(q.processId ? { processId: q.processId } : {}),
        ...(q.departmentId ? { process: { departmentId: q.departmentId } } : {}),
        ...createdAtRange(q),
      };

      const [
        findingsTotal,
        findingsOpen,
        findingsOverdue,
        ncTotal,
        ncOpen,
        actionsTotal,
        actionsPending,
        actionsOverdue,
        tasksTotal,
        tasksPending,
        tasksOverdue,
        proceduresTotal,
        proceduresApproved,
        risksTotal,
        risksActive,
        risksHigh,
        opportunitiesTotal,
        opportunitiesOpen,
      ] = await Promise.all([
        prisma.finding.count({ where: scope }),
        prisma.finding.count({ where: { ...scope, ...OPEN_FINDING } }),
        prisma.finding.count({ where: { ...scope, ...OPEN_FINDING, dueDate: { lt: now } } }),
        prisma.nonConformity.count({ where: scope }),
        prisma.nonConformity.count({ where: { ...scope, ...OPEN_NC } }),
        prisma.action.count({ where: actionScope }),
        prisma.action.count({ where: { ...actionScope, ...PENDING_ACTION } }),
        prisma.action.count({ where: { ...actionScope, ...OPEN_ACTION, dueDate: { lt: now } } }),
        prisma.task.count({ where: scope }),
        prisma.task.count({ where: { ...scope, ...PENDING_TASK } }),
        prisma.task.count({ where: { ...scope, ...OPEN_TASK, dueDate: { lt: now } } }),
        prisma.procedure.count({ where: procedureScope }),
        prisma.procedure.count({ where: { ...procedureScope, status: 'APPROVED' } }),
        prisma.risk.count({ where: scope }),
        prisma.risk.count({ where: { ...scope, ...ACTIVE_RISK } }),
        prisma.risk.count({ where: { ...scope, ...ACTIVE_RISK, level: { gte: 15 } } }),
        prisma.opportunity.count({ where: scope }),
        prisma.opportunity.count({ where: { ...scope, ...OPEN_OPPORTUNITY } }),
      ]);

      // offTarget assumes higher-is-better: latest value below target counts as off target
      const kpis = await prisma.kpi.findMany({
        where: scope,
        select: { target: true, values: { orderBy: { date: 'desc' }, take: 1 } },
      });
      const offTarget = kpis.filter((k) => k.values[0] !== undefined && k.values[0].value < k.target).length;

      return {
        findings: { total: findingsTotal, open: findingsOpen, overdue: findingsOverdue },
        nonConformities: { total: ncTotal, open: ncOpen },
        actions: { total: actionsTotal, pending: actionsPending, overdue: actionsOverdue },
        tasks: { total: tasksTotal, pending: tasksPending, overdue: tasksOverdue },
        procedures: { total: proceduresTotal, approved: proceduresApproved },
        risks: { total: risksTotal, active: risksActive, high: risksHigh },
        opportunities: { total: opportunitiesTotal, open: opportunitiesOpen },
        kpis: { total: kpis.length, offTarget },
      };
    },

    async charts(q: ChartsQuery) {
      const scope = relScope(q);

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

      const taskGroups = await prisma.task.groupBy({
        by: ['status'],
        where: scope,
        _count: { _all: true },
      });
      const tasksByStatus = taskGroups.map((g) => ({ status: g.status, count: g._count._all }));

      const risks = await prisma.risk.findMany({ where: scope, select: { level: true } });
      const bucketOf = (level: number) =>
        level <= 4 ? '1-4' : level <= 9 ? '5-9' : level <= 14 ? '10-14' : '15-25';
      const bucketCounts = new Map<string, number>([
        ['1-4', 0],
        ['5-9', 0],
        ['10-14', 0],
        ['15-25', 0],
      ]);
      for (const r of risks) {
        const b = bucketOf(r.level);
        bucketCounts.set(b, (bucketCounts.get(b) ?? 0) + 1);
      }
      const risksByLevel = [...bucketCounts.entries()].map(([level, count]) => ({ level, count }));

      const kpis = await prisma.kpi.findMany({
        where: scope,
        select: { name: true, target: true, values: { orderBy: { date: 'desc' }, take: 1 } },
        orderBy: { name: 'asc' },
      });
      const kpiCompliance = kpis.map((k) => {
        const latest = k.values[0]?.value ?? null;
        return { kpi: k.name, target: k.target, latest, compliant: latest !== null && latest >= k.target };
      });

      return { findingsByMonth, findingsByDepartment, tasksByStatus, risksByLevel, kpiCompliance };
    },
  };
}
