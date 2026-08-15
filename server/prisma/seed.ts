import { PrismaClient, type Priority, type FindingStatus, type ActionType, type KpiFrequency } from '@prisma/client'
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

  // Processes (2 per dept, skip for brevity — pick representative ones)
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
    await prisma.procedure.upsert({
      where: { id: pd.code },
      update: {},
      create: { code: pd.code, title: pd.title, processId: processes[pd.process].id, version: '1.0', status: 'APPROVED' },
    }).catch(() =>
      prisma.procedure.create({ data: { code: pd.code, title: pd.title, processId: processes[pd.process].id, version: '1.0', status: 'APPROVED' } }),
    )
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
    await prisma.finding.create({
      data: {
        title: f.title,
        code: f.code,
        priority: f.priority as Priority,
        status: f.status as FindingStatus,
        processId: processes[f.process].id,
        dueDate: new Date(2026, 8, 30),
      },
    })
  }
  console.log(`  Findings: ${findings.length}`)

  // NonConformities
  const ncs = [
    { title: 'Documentos sin vigencia', process: 'Gestión documental' },
    { title: 'Incumplimiento de política de seguridad', process: 'Infraestructura TI' },
  ]
  for (const nc of ncs) {
    await prisma.nonConformity.create({
      data: { title: nc.title, status: 'OPEN', processId: processes[nc.process].id },
    })
  }
  console.log(`  NonConformities: ${ncs.length}`)

  // Risks
  const risks = [
    { title: 'Rotación de personal', probability: 4, impact: 3, process: 'Contratación' },
    { title: 'Error en cálculo de nómina', probability: 2, impact: 5, process: 'Nómina' },
    { title: 'Falla en infraestructura crítica', probability: 3, impact: 5, process: 'Infraestructura TI' },
    { title: 'Incumplimiento regulatorio', probability: 2, impact: 4, process: 'Gestión de riesgos' },
  ]
  for (const r of risks) {
    await prisma.risk.create({
      data: {
        title: r.title,
        probability: r.probability,
        impact: r.impact,
        level: r.probability * r.impact,
        processId: processes[r.process].id,
      },
    })
  }
  console.log(`  Risks: ${risks.length}`)

  // Opportunities
  const opps = [
    { title: 'Digitalización de proceso de selección', process: 'Contratación' },
    { title: 'Automatización de cierre de nómina', process: 'Nómina' },
    { title: 'Implementar sistema de ticketing TI', process: 'Infraestructura TI' },
  ]
  for (const o of opps) {
    await prisma.opportunity.create({
      data: { title: o.title, processId: processes[o.process].id },
    })
  }
  console.log(`  Opportunities: ${opps.length}`)

  // Actions (linking to findings)
  const allFindings = await prisma.finding.findMany({ where: { code: { in: ['H-001', 'H-003', 'H-005'] } } })
  const findingMap = Object.fromEntries(allFindings.map((f) => [f.code!, f]))

  const actions = [
    { title: 'Elaborar instructivo de selección', type: 'CORRECTIVE', findingCode: 'H-001' },
    { title: 'Implementar revisión trimestral', type: 'PREVENTIVE', findingCode: 'H-003' },
    { title: 'Registrar historial de mantenimiento', type: 'CORRECTIVE', findingCode: 'H-005' },
  ]
  for (const a of actions) {
    await prisma.action.create({
      data: {
        title: a.title,
        type: a.type as ActionType,
        status: 'PENDING',
        findingId: findingMap[a.findingCode]?.id,
        dueDate: new Date(2026, 9, 15),
      },
    })
  }
  console.log(`  Actions: ${actions.length}`)

  // Tasks
  await prisma.task.createMany({
    data: [
      { title: 'Redactar documento de procedimiento de selección', status: 'PENDING', priority: 'HIGH', processId: processes['Contratación'].id, dueDate: new Date(2026, 8, 20) },
      { title: 'Revisar cálculos nómina julio', status: 'IN_PROGRESS', priority: 'MEDIUM', processId: processes['Nómina'].id, dueDate: new Date(2026, 8, 25) },
      { title: 'Levantar inventario de activos TI', status: 'PENDING', priority: 'HIGH', processId: processes['Infraestructura TI'].id, dueDate: new Date(2026, 9, 1) },
      { title: 'Actualizar matriz de riesgos', status: 'DONE', priority: 'MEDIUM', processId: processes['Gestión de riesgos'].id, dueDate: new Date(2026, 7, 15) },
    ],
  })
  console.log('  Tasks: 4')

  // Activities
  await prisma.activity.createMany({
    data: [
      { title: 'Visita a departamento de RRHH', date: new Date(2026, 7, 10), departmentId: depts['Recursos Humanos'].id, processId: processes['Contratación'].id, userId: admin.id },
      { title: 'Revisión de documentación financiera', date: new Date(2026, 7, 11), departmentId: depts['Finanzas'].id, processId: processes['Presupuesto'].id, userId: admin.id },
      { title: 'Inspección de infraestructura TI', date: new Date(2026, 7, 12), departmentId: depts['Tecnología / IT'].id, processId: processes['Infraestructura TI'].id, userId: admin.id },
    ],
  })
  console.log('  Activities: 3')

  // KPIs with values (6 months)
  const kpiDefs = [
    { name: '% Acciones correctivas cerradas', unit: '%', target: 80, frequency: 'MONTHLY', process: 'Contratación', formula: 'cerradas / totales * 100' },
    { name: '% Hallazgos cerrados a tiempo', unit: '%', target: 90, frequency: 'MONTHLY', process: 'Nómina', formula: 'cerrados_a_tiempo / total * 100' },
    { name: 'Tareas completadas por semana', unit: 'uds', target: 10, frequency: 'WEEKLY', process: 'Producción', formula: 'completadas' },
    { name: 'Riesgos mitigados', unit: '%', target: 70, frequency: 'QUARTERLY', process: 'Gestión de riesgos', formula: 'mitigados / total * 100' },
  ]

  const months = ['2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07']
  const kpiValues: Record<string, number[]> = {
    '% Acciones correctivas cerradas': [65, 70, 72, 75, 78, 82],
    '% Hallazgos cerrados a tiempo': [80, 75, 85, 88, 90, 87],
    'Tareas completadas por semana': [8, 12, 9, 11, 10, 13],
    'Riesgos mitigados': [50, 55, 60, 62, 65, 68],
  }

  for (const kd of kpiDefs) {
    const kpi = await prisma.kpi.create({
      data: {
        name: kd.name,
        unit: kd.unit,
        target: kd.target,
        frequency: kd.frequency as KpiFrequency,
        processId: processes[kd.process].id,
        formula: kd.formula,
      },
    })
    const vals = kpiValues[kd.name] ?? []
    for (let i = 0; i < months.length; i++) {
      await prisma.kpiValue.create({
        data: { kpiId: kpi.id, value: vals[i] ?? 0, period: months[i], date: new Date(`${months[i]}-15`) },
      })
    }
  }
  console.log(`  KPIs: ${kpiDefs.length} (${months.length} values each)`)

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
