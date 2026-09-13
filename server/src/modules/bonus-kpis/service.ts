import type { Prisma, PrismaClient } from '@prisma/client';
import { createdAtRange, pageArgs } from '../../lib/pagination.js';
import { calculateBonusMetric, performanceLevel, type BonusMetricResult } from './engine.js';
import type {
  BonusActionBody,
  BonusActionsQuery,
  BonusConfigBody,
  BonusFindingBody,
  BonusFindingsQuery,
  BonusPeriodQuery,
  BonusProcedureBody,
  BonusProceduresQuery,
} from './schemas.js';

interface BonusScope {
  from?: Date;
  to?: Date;
  departmentId?: string;
}

const findingInclude = { department: true } satisfies Prisma.BonusFindingInclude;
const actionInclude = { finding: { include: { department: true } } } satisfies Prisma.BonusImprovementActionInclude;
const procedureInclude = { department: true, process: true } satisfies Prisma.BonusProcedureInclude;

function periodBounds(year: number, month: number): { start: Date; end: Date } {
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

function periodLabel(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function previousPeriod(year: number, month: number, offset: number): { year: number; month: number } {
  const date = new Date(Date.UTC(year, month - 1 - offset, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

function configByKey(configs: Array<{
  key: string;
  name: string;
  maxPoints: number;
  thresholds: Array<{ minCount: number; points: number }>;
}>, key: string) {
  const config = configs.find((item) => item.key === key);
  if (!config) throw new Error(`Missing bonus KPI configuration: ${key}`);
  return config;
}

export function bonusKpiService(prisma: PrismaClient) {
  async function configs() {
    return prisma.bonusKpiConfig.findMany({
      include: { thresholds: { orderBy: { minCount: 'asc' } } },
      orderBy: { key: 'asc' },
    });
  }

  async function periodResults(
    year: number,
    month: number,
    configData: Awaited<ReturnType<typeof configs>>,
    scope: BonusScope = {},
  ) {
    const monthlyBounds = periodBounds(year, month);
    const start = scope.from ?? monthlyBounds.start;
    const end = scope.to
      ? new Date(scope.to.getTime() + 24 * 60 * 60 * 1000)
      : monthlyBounds.end;
    const processScope = scope.departmentId ? { process: { departmentId: scope.departmentId } } : {};
    const [findings, closedFindings, procedures] = await Promise.all([
      prisma.finding.findMany({
        where: { ...processScope, createdAt: { gte: start, lt: end } },
        select: { id: true, file: { select: { id: true } } },
      }),
      prisma.finding.findMany({
        where: {
          ...processScope,
          status: 'CLOSED',
          OR: [
            { closedAt: { gte: start, lt: end } },
            { closedAt: null, updatedAt: { gte: start, lt: end } },
          ],
        },
        select: { id: true, file: { select: { id: true } } },
      }),
      prisma.procedure.findMany({
        where: { ...processScope, status: 'APPROVED', createdAt: { gte: start, lt: end } },
        select: { id: true, file: { select: { id: true } } },
      }),
    ]);

    const validFindings = findings;
    const successfulActions = closedFindings;
    const completedProcedures = procedures;

    const metrics: BonusMetricResult[] = [
      calculateBonusMetric({
        ...configByKey(configData, 'FINDINGS_MANAGEMENT'),
        thresholds: configByKey(configData, 'FINDINGS_MANAGEMENT').thresholds,
        count: validFindings.length,
        recordIds: validFindings.map((item) => item.id),
        evidenceCount: validFindings.filter((item) => item.file !== null).length,
      }),
      calculateBonusMetric({
        ...configByKey(configData, 'CONTINUOUS_IMPROVEMENT'),
        thresholds: configByKey(configData, 'CONTINUOUS_IMPROVEMENT').thresholds,
        count: successfulActions.length,
        recordIds: successfulActions.map((item) => item.id),
        evidenceCount: successfulActions.filter((item) => item.file !== null).length,
      }),
      calculateBonusMetric({
        ...configByKey(configData, 'PROCEDURES_MANAGEMENT'),
        thresholds: configByKey(configData, 'PROCEDURES_MANAGEMENT').thresholds,
        count: completedProcedures.length,
        recordIds: completedProcedures.map((item) => item.id),
        evidenceCount: completedProcedures.filter((item) => item.file !== null).length,
      }),
    ];

    return { period: periodLabel(year, month), metrics };
  }

  async function dashboard(period: BonusPeriodQuery) {
    const configData = await configs();
    const selected = await periodResults(period.year, period.month, configData, {
      from: period.from,
      to: period.to,
      departmentId: period.departmentId,
    });
    const history = await Promise.all(
      Array.from({ length: 12 }, (_, index) => {
        const item = previousPeriod(period.year, period.month, 11 - index);
        return periodResults(item.year, item.month, configData, { departmentId: period.departmentId });
      }),
    );
    const metrics = selected.metrics;
    const currentScore = metrics.reduce((total, metric) => total + metric.score, 0);
    const maxScore = configData.reduce((total, config) => total + config.maxPoints, 0);
    return {
      year: period.year,
      month: period.month,
      period: selected.period,
      kpis: metrics,
      summary: {
        currentScore,
        maxScore,
        compliance: maxScore > 0 ? Math.round((currentScore / maxScore) * 100) : 0,
        performanceLevel: performanceLevel(currentScore, maxScore),
      },
      history: history.map((item) => {
        const totalScore = item.metrics.reduce((total, metric) => total + metric.score, 0);
        return {
          period: item.period,
          totalScore,
          kpis: item.metrics.map((metric) => ({ key: metric.key, count: metric.count, score: metric.score })),
        };
      }),
    };
  }

  return {
    configs,
    dashboard,
    updateConfig: async (key: string, data: BonusConfigBody) => {
      const config = await prisma.bonusKpiConfig.findUnique({ where: { key } });
      if (!config) return null;
      return prisma.$transaction(async (tx) => {
        const updated = await tx.bonusKpiConfig.update({
          where: { key },
          data: {
            ...(data.name ? { name: data.name } : {}),
            ...(data.description ? { description: data.description } : {}),
            ...(data.maxPoints !== undefined ? { maxPoints: data.maxPoints } : {}),
          },
        });
        if (data.thresholds) {
          await tx.bonusKpiThreshold.deleteMany({ where: { configId: config.id } });
          await tx.bonusKpiThreshold.createMany({
            data: data.thresholds.map((threshold) => ({ ...threshold, configId: config.id })),
          });
        }
        return tx.bonusKpiConfig.findUnique({ where: { id: updated.id }, include: { thresholds: true } });
      });
    },

    async listFindings(q: BonusFindingsQuery) {
      const where: Prisma.BonusFindingWhereInput = {
        ...(q.search ? { description: { contains: q.search, mode: 'insensitive' } } : {}),
        ...(q.departmentId ? { departmentId: q.departmentId } : {}),
        ...(q.status ? { status: q.status } : {}),
        ...createdAtRange(q),
      };
      const [data, total] = await Promise.all([
        prisma.bonusFinding.findMany({ where, include: findingInclude, ...pageArgs(q), orderBy: { detectionDate: 'desc' } }),
        prisma.bonusFinding.count({ where }),
      ]);
      return { data, total };
    },
    getFinding: (id: string) => prisma.bonusFinding.findUnique({ where: { id }, include: findingInclude }),
    createFinding: (data: BonusFindingBody) => prisma.bonusFinding.create({ data, include: findingInclude }),
    updateFinding: (id: string, data: Partial<BonusFindingBody>) => prisma.bonusFinding.update({ where: { id }, data, include: findingInclude }),
    removeFinding: async (id: string) => { await prisma.bonusFinding.delete({ where: { id } }); },

    async listActions(q: BonusActionsQuery) {
      const where: Prisma.BonusImprovementActionWhereInput = {
        ...(q.search ? { action: { contains: q.search, mode: 'insensitive' } } : {}),
        ...(q.status ? { status: q.status } : {}),
        ...(q.findingId ? { findingId: q.findingId } : {}),
        ...createdAtRange(q),
      };
      const [data, total] = await Promise.all([
        prisma.bonusImprovementAction.findMany({ where, include: actionInclude, ...pageArgs(q), orderBy: { createdAt: 'desc' } }),
        prisma.bonusImprovementAction.count({ where }),
      ]);
      return { data, total };
    },
    getAction: (id: string) => prisma.bonusImprovementAction.findUnique({ where: { id }, include: actionInclude }),
    createAction: async (data: BonusActionBody, userId: string) => prisma.bonusImprovementAction.create({
      data: {
        ...data,
        ...(data.resultValidated ? { validatedById: userId, validatedAt: new Date() } : {}),
      },
      include: actionInclude,
    }),
    updateAction: async (id: string, data: Partial<BonusActionBody>, userId: string) => prisma.bonusImprovementAction.update({
      where: { id },
      data: {
        ...data,
        ...(data.resultValidated === true ? { validatedById: userId, validatedAt: new Date() } : {}),
        ...(data.resultValidated === false ? { validatedById: null, validatedAt: null } : {}),
      },
      include: actionInclude,
    }),
    removeAction: async (id: string) => { await prisma.bonusImprovementAction.delete({ where: { id } }); },

    async listProcedures(q: BonusProceduresQuery) {
      const where: Prisma.BonusProcedureWhereInput = {
        ...(q.search ? { name: { contains: q.search, mode: 'insensitive' } } : {}),
        ...(q.departmentId ? { departmentId: q.departmentId } : {}),
        ...(q.processId ? { processId: q.processId } : {}),
        ...createdAtRange(q),
      };
      const [data, total] = await Promise.all([
        prisma.bonusProcedure.findMany({ where, include: procedureInclude, ...pageArgs(q), orderBy: { identificationDate: 'desc' } }),
        prisma.bonusProcedure.count({ where }),
      ]);
      return { data, total };
    },
    getProcedure: (id: string) => prisma.bonusProcedure.findUnique({ where: { id }, include: procedureInclude }),
    createProcedure: (data: BonusProcedureBody) => prisma.bonusProcedure.create({ data, include: procedureInclude }),
    updateProcedure: (id: string, data: Partial<BonusProcedureBody>) => prisma.bonusProcedure.update({ where: { id }, data, include: procedureInclude }),
    removeProcedure: async (id: string) => { await prisma.bonusProcedure.delete({ where: { id } }); },

    history: async (entity: string, id: string) => prisma.auditLog.findMany({
      where: { entity, entityId: id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  };
}
