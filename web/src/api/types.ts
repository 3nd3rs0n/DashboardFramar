// Mirrors Prisma enums at server/prisma/schema.prisma — the only valid values.
export const ROLES = ['ADMIN', 'ANALYST', 'VIEWER'] as const
export type Role = (typeof ROLES)[number]

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
export type Priority = (typeof PRIORITIES)[number]

export const FINDING_STATUSES = [
  'OPEN',
  'IN_ANALYSIS',
  'ACTION_DEFINED',
  'IN_EXECUTION',
  'PENDING_VERIFICATION',
  'CLOSED',
  'REOPENED',
] as const
export type FindingStatus = (typeof FINDING_STATUSES)[number]

export const NON_CONFORMITY_STATUSES = ['OPEN', 'IN_TREATMENT', 'CLOSED'] as const
export type NonConformityStatus = (typeof NON_CONFORMITY_STATUSES)[number]

export const RISK_STATUSES = ['IDENTIFIED', 'ASSESSED', 'IN_TREATMENT', 'MONITORED', 'CLOSED'] as const
export type RiskStatus = (typeof RISK_STATUSES)[number]

export const OPPORTUNITY_STATUSES = ['IDENTIFIED', 'EVALUATED', 'IN_PROGRESS', 'IMPLEMENTED', 'CLOSED'] as const
export type OpportunityStatus = (typeof OPPORTUNITY_STATUSES)[number]

export const ACTION_TYPES = ['CORRECTIVE', 'PREVENTIVE', 'IMPROVEMENT'] as const
export type ActionType = (typeof ACTION_TYPES)[number]

export const ACTION_STATUSES = ['PENDING', 'IN_PROGRESS', 'DONE', 'VERIFIED', 'CANCELLED'] as const
export type ActionStatus = (typeof ACTION_STATUSES)[number]

export const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

export const PROCEDURE_STATUSES = ['DRAFT', 'IN_REVIEW', 'APPROVED', 'OBSOLETE'] as const
export type ProcedureStatus = (typeof PROCEDURE_STATUSES)[number]

export const KPI_FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'] as const
export type KpiFrequency = (typeof KPI_FREQUENCIES)[number]

// Entities
export interface User {
  id: string
  email: string
  name: string
  role: Role
  createdAt?: string
}

export interface Department {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface Process {
  id: string
  name: string
  description: string | null
  departmentId: string
  department?: Department
  createdAt: string
}

export interface ProcedureFile {
  id: string
  filename: string
  mimetype: string
  size: number
  createdAt: string
}

export interface Procedure {
  id: string
  code: string | null
  title: string
  content: string | null
  version: string
  status: ProcedureStatus
  processId: string
  process?: Process
  file?: ProcedureFile | null
  createdAt: string
}

interface Base {
  id: string
  title: string
  description: string | null
  createdAt: string
  responsibleId: string | null
}

export interface Finding extends Base {
  code: string | null
  type: string
  priority: Priority
  status: FindingStatus
  cause: string | null
  evidence: string | null
  dueDate: string | null
  closedAt: string | null
  processId: string
  process?: Process
}

export interface NonConformity extends Base {
  code: string | null
  requirement: string | null
  status: NonConformityStatus
  processId: string
  process?: Process
  detectedAt: string
  closedAt: string | null
}

export interface Risk extends Base {
  probability: number
  impact: number
  level: number
  status: RiskStatus
  mitigation: string | null
  processId: string
  process?: Process
}

export interface Opportunity extends Base {
  benefit: string | null
  status: OpportunityStatus
  processId: string
  process?: Process
}

export interface AuditAction extends Base {
  type: ActionType
  status: ActionStatus
  dueDate: string | null
  completedAt: string | null
  findingId: string | null
  finding?: Finding | null
  nonConformityId: string | null
  nonConformity?: NonConformity | null
  riskId: string | null
  risk?: Risk | null
  opportunityId: string | null
  opportunity?: Opportunity | null
}

export interface Task extends Base {
  status: TaskStatus
  priority: Priority
  dueDate: string | null
  completedAt: string | null
  actionId: string | null
  action?: AuditAction | null
  processId: string | null
  process?: Process | null
}

export interface Activity {
  id: string
  title: string
  description: string | null
  date: string
  processId: string | null
  process?: Process | null
  departmentId: string | null
  department?: Department | null
  userId: string
  user?: User
  createdAt: string
}

export interface Kpi {
  id: string
  name: string
  description: string | null
  formula: string | null
  unit: string
  target: number
  frequency: KpiFrequency
  processId: string
  process?: Process
  responsibleId: string | null
  values?: KpiValue[]
  createdAt: string
}

export interface KpiValue {
  id: string
  kpiId: string
  value: number
  period: string
  date: string
  createdAt: string
}

// API envelopes
export interface ListResponse<T> {
  data: T[]
  total: number
}

export interface LoginResponse {
  token: string
  user: User
}

// Dashboard
export interface DashboardSummary {
  findings: { total: number; open: number; overdue: number }
  nonConformities: { total: number; open: number }
  actions: { total: number; pending: number; overdue: number }
  tasks: { total: number; pending: number; overdue: number }
  procedures: { total: number; approved: number }
  risks: { total: number; active: number; high: number }
  opportunities: { total: number; open: number }
  kpis: { total: number; offTarget: number }
}

export interface DashboardCharts {
  findingsByMonth: { month: string; count: number }[]
  findingsByDepartment: { department: string; count: number }[]
  tasksByStatus: { status: string; count: number }[]
  risksByLevel: { level: string; count: number }[]
  kpiCompliance: { kpi: string; target: number; latest: number; compliant: boolean }[]
}
