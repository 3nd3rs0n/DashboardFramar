import { PrismaClient, type Priority, type FindingStatus, type KpiFrequency } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Admin user
  const passwordHash = await hash('Admin123!', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: { email: 'admin@example.com', name: 'Administrador', passwordHash, role: 'ADMIN' },
  })
  console.log(`  User: ${admin.email}`)

  // Departments
  const deptNames = [
    'Recursos Humanos',
    'Finanzas',
    'Operaciones',
    'Mantenimiento',
    'Prevención de Riesgos',
    'Tecnología / IT',
    'Administración',
  ]
  const depts: Record<string, { id: string }> = {}
  for (const name of deptNames) {
    const d = await prisma.department.upsert({ where: { name }, update: {}, create: { name } })
    depts[name] = d
  }
  console.log(`  Departments: ${Object.keys(depts).length}`)

  // Processes
  const processData = [
    { name: 'Contratación', dept: 'Recursos Humanos' },
    { name: 'Nómina', dept: 'Recursos Humanos' },
    { name: 'Presupuesto', dept: 'Finanzas' },
    { name: 'Cuentas por cobrar', dept: 'Finanzas' },
    { name: 'Producción', dept: 'Operaciones' },
    { name: 'Logística', dept: 'Operaciones' },
    { name: 'Mantenimiento preventivo', dept: 'Mantenimiento' },
    { name: 'Gestión de riesgos', dept: 'Prevención de Riesgos' },
    { name: 'Infraestructura TI', dept: 'Tecnología / IT' },
    { name: 'Gestión documental', dept: 'Administración' },
  ]
  const processes: Record<string, { id: string }> = {}
  for (const pd of processData) {
    const p = await prisma.process.upsert({
      where: { departmentId_name: { departmentId: depts[pd.dept].id, name: pd.name } },
      update: {},
      create: { name: pd.name, departmentId: depts[pd.dept].id },
    })
    processes[pd.name] = p
  }
  console.log(`  Processes: ${Object.keys(processes).length}`)

  // Procedures
  const procData = [
    { title: 'Proceso de selección de personal', code: 'PR-001', process: 'Contratación' },
    { title: 'Cálculo de nómina mensual', code: 'PR-002', process: 'Nómina' },
    { title: 'Elaboración de presupuesto anual', code: 'PR-003', process: 'Presupuesto' },
    { title: 'Proceso de facturación', code: 'PR-004', process: 'Cuentas por cobrar' },
  ]
  for (const pd of procData) {
    const existing = await prisma.procedure.findFirst({ where: { code: pd.code } })
    if (!existing) {
      await prisma.procedure.create({
        data: { code: pd.code, title: pd.title, processId: processes[pd.process].id, version: '1.0', status: 'APPROVED' },
      })
    }
  }
  console.log(`  Procedures: ${procData.length}`)

  // Findings
  const findings = [
    { title: 'Falta de documentación en proceso de selección', code: 'H-001', priority: 'HIGH', status: 'OPEN', process: 'Contratación' },
    { title: 'Demora en cierre de nómina', code: 'H-002', priority: 'MEDIUM', status: 'IN_ANALYSIS', process: 'Nómina' },
    { title: 'Sin evidencia de revisión presupuestaria', code: 'H-003', priority: 'HIGH', status: 'ACTION_DEFINED', process: 'Presupuesto' },
    { title: 'Proceso de facturación no estandarizado', code: 'H-004', priority: 'MEDIUM', status: 'OPEN', process: 'Cuentas por cobrar' },
    { title: 'Mantenimiento preventivo no registrado', code: 'H-005', priority: 'CRITICAL', status: 'IN_EXECUTION', process: 'Mantenimiento preventivo' },
    { title: 'Sin plan de contingencia TI', code: 'H-006', priority: 'HIGH', status: 'OPEN', process: 'Infraestructura TI' },
  ]
  for (const f of findings) {
    await prisma.finding.upsert({
      where: { code: f.code },
      update: {},
      create: {
        title: f.title,
        code: f.code,
        priority: f.priority as Priority,
        status: f.status as FindingStatus,
        processId: processes[f.process].id,
        dueDate: new Date(2026, 8, 30),
      },
    })
  }
  await prisma.$executeRaw`
    SELECT setval(
      '"finding_code_seq"',
      GREATEST(COALESCE((SELECT MAX((substring("code" FROM '^H-([0-9]+)$'))::bigint) FROM "Finding"), 1), 1),
      (SELECT MAX((substring("code" FROM '^H-([0-9]+)$'))::bigint) FROM "Finding") IS NOT NULL
    )
  `
  console.log(`  Findings: ${findings.length}`)

  // Tasks
  const tasksData = [
    { title: 'Redactar documento de procedimiento de selección', status: 'PENDING' as const, priority: 'HIGH' as const, departmentName: 'Recursos Humanos', dueDate: new Date(2026, 8, 20) },
    { title: 'Revisar cálculos nómina julio', status: 'IN_PROGRESS' as const, priority: 'MEDIUM' as const, departmentName: 'Recursos Humanos', dueDate: new Date(2026, 8, 25) },
    { title: 'Levantar inventario de activos TI', status: 'PENDING' as const, priority: 'HIGH' as const, departmentName: 'Tecnología / IT', dueDate: new Date(2026, 9, 1) },
    { title: 'Actualizar matriz de riesgos', status: 'DONE' as const, priority: 'MEDIUM' as const, departmentName: 'Prevención de Riesgos', dueDate: new Date(2026, 7, 15) },
  ]
  for (const t of tasksData) {
    const existing = await prisma.task.findFirst({ where: { title: t.title } })
    if (!existing) {
      await prisma.task.create({
        data: {
          title: t.title,
          status: t.status,
          priority: t.priority,
          departmentId: depts[t.departmentName].id,
          dueDate: t.dueDate,
        },
      })
    }
  }
  console.log(`  Tasks: ${tasksData.length}`)

  // KPIs with values (6 months)
  const kpiDefs = [
    { name: '% Hallazgos cerrados a tiempo', unit: '%', target: 90, frequency: 'MONTHLY', process: 'Nómina', formula: 'cerrados_a_tiempo / total * 100' },
    { name: 'Tareas completadas por semana', unit: 'uds', target: 10, frequency: 'WEEKLY', process: 'Producción', formula: 'completadas' },
  ]

  const months = ['2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07']
  const kpiValues: Record<string, number[]> = {
    '% Hallazgos cerrados a tiempo': [80, 75, 85, 88, 90, 87],
    'Tareas completadas por semana': [8, 12, 9, 11, 10, 13],
  }

  for (const kd of kpiDefs) {
    const existing = await prisma.kpi.findFirst({ where: { name: kd.name } })
    let kpi
    if (!existing) {
      kpi = await prisma.kpi.create({
        data: {
          name: kd.name,
          unit: kd.unit,
          target: kd.target,
          frequency: kd.frequency as KpiFrequency,
          processId: processes[kd.process].id,
          formula: kd.formula,
        },
      })
    } else {
      kpi = existing
    }
    const vals = kpiValues[kd.name] ?? []
    for (let i = 0; i < months.length; i++) {
      await prisma.kpiValue.upsert({
        where: { kpiId_period: { kpiId: kpi.id, period: months[i] } },
        update: { value: vals[i] ?? 0 },
        create: { kpiId: kpi.id, value: vals[i] ?? 0, period: months[i], date: new Date(`${months[i]}-15`) },
      })
    }
  }
  console.log(`  KPIs: ${kpiDefs.length} (${months.length} values each)`)

  // Bonus KPI configuration. Thresholds are stored as data so they can be changed without changing the engine.
  const bonusConfigs = [
    {
      key: 'FINDINGS_MANAGEMENT',
      name: 'Gestión de Hallazgos',
      description: 'Hallazgos válidos registrados durante el mes.',
      maxPoints: 3,
      thresholds: [{ minCount: 0, points: 1 }, { minCount: 9, points: 2 }, { minCount: 11, points: 3 }],
    },
    {
      key: 'CONTINUOUS_IMPROVEMENT',
      name: 'Cierre de Acciones de Mejora Continua',
      description: 'Acciones cerradas exitosamente con evidencia y resultado validado.',
      maxPoints: 4,
      thresholds: [{ minCount: 3, points: 1 }, { minCount: 5, points: 3 }, { minCount: 7, points: 4 }],
    },
    {
      key: 'PROCEDURES_MANAGEMENT',
      name: 'Gestión de Procedimientos',
      description: 'Procedimientos que completaron todas las etapas del flujo.',
      maxPoints: 3,
      thresholds: [{ minCount: 0, points: 1 }, { minCount: 9, points: 2 }, { minCount: 11, points: 3 }],
    },
  ]
  for (const configData of bonusConfigs) {
    const config = await prisma.bonusKpiConfig.upsert({
      where: { key: configData.key },
      update: { name: configData.name, description: configData.description, maxPoints: configData.maxPoints },
      create: { key: configData.key, name: configData.name, description: configData.description, maxPoints: configData.maxPoints },
    })
    if (configData.key === 'FINDINGS_MANAGEMENT') {
      await prisma.bonusKpiThreshold.deleteMany({ where: { configId: config.id, minCount: { in: [8, 10, 12] } } })
    }
    if (configData.key === 'PROCEDURES_MANAGEMENT') {
      await prisma.bonusKpiThreshold.deleteMany({ where: { configId: config.id, minCount: { in: [8, 10, 12] } } })
    }
    if (configData.key === 'CONTINUOUS_IMPROVEMENT') {
      await prisma.bonusKpiThreshold.deleteMany({ where: { configId: config.id, minCount: { in: [4, 6, 8] } } })
    }
    for (const threshold of configData.thresholds) {
      await prisma.bonusKpiThreshold.upsert({
        where: { configId_minCount: { configId: config.id, minCount: threshold.minCount } },
        update: { points: threshold.points },
        create: { configId: config.id, minCount: threshold.minCount, points: threshold.points },
      })
    }
  }
  console.log(`  Bonus KPI configurations: ${bonusConfigs.length}`)

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
