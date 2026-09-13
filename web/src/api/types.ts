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
  dueDate: string | null
  processId: string
  process?: Process
  file?: ProcedureFile | null
  comments?: { id: string }[]
  createdAt: string
}

export interface ProcedureHistoryEntry {
  id: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  changes: unknown
  createdAt: string
  user: TaskUser | null
}

export interface ProcedureComment {
  id: string
  body: string
  createdAt: string
  updatedAt: string
  user: TaskUser
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
  dueDate: string | null
  closedAt: string | null
  processId: string
  process?: Process
  file?: ProcedureFile | null
  comments?: { id: string }[]
}

export interface FindingHistoryEntry {
  id: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  changes: unknown
  createdAt: string
  user: TaskUser | null
}

export interface FindingComment {
  id: string
  body: string
  createdAt: string
  updatedAt: string
  user: TaskUser
}

export interface FindingParticipant {
  findingId: string
  userId: string
  createdAt: string
  user: User
}

export interface Task extends Base {
  status: TaskStatus
  priority: Priority
  dueDate: string | null
  completedAt: string | null
  departmentId: string | null
  department?: Department | null
  comments?: { id: string }[]
}

export interface TaskUser {
  id: string
  name: string
  email: string
}

export interface TaskHistoryEntry {
  id: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  changes: unknown
  createdAt: string
  user: TaskUser | null
}

export interface TaskComment {
  id: string
  body: string
  createdAt: string
  updatedAt: string
  user: TaskUser
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
  counts?: {
    pending: number
    inProgress: number
    done: number
    cancelled: number
  }
}

export interface LoginResponse {
  token: string
  user: User
}

// Dashboard
export interface DashboardSummary {
  findings: { total: number; open: number; overdue: number }
  tasks: { total: number; pending: number; overdue: number }
  procedures: { total: number; approved: number }
  kpis: { total: number; offTarget: number }
}

export interface DashboardCharts {
  findingsByMonth: { month: string; count: number }[]
  findingsByDepartment: { department: string; count: number }[]
  proceduresByMonth: { month: string; DRAFT: number; IN_REVIEW: number; APPROVED: number; OBSOLETE: number }[]
  tasksByStatus: { status: string; count: number }[]
  kpiCompliance: { kpi: string; target: number; latest: number; compliant: boolean }[]
}

export interface BonusThreshold {
  minCount: number
  points: number
}

export interface BonusKpiConfig {
  id: string
  key: string
  name: string
  description: string
  maxPoints: number
  thresholds: BonusThreshold[]
}

export interface BonusMetricResult {
  key: string
  name: string
  count: number
  score: number
  maxPoints: number
  progress: number
  targetReached: BonusThreshold | null
  nextTarget: BonusThreshold | null
  missingForNext: number
  traceability: {
    recordIds: string[]
    dataUsed: number
    evidenceCount: number
    calculation: string
    score: number
  }
}

export interface BonusHistoryPoint {
  period: string
  totalScore: number
  kpis: { key: string; count: number; score: number }[]
}

export interface BonusDashboard {
  year: number
  month: number
  period: string
  kpis: BonusMetricResult[]
  summary: {
    currentScore: number
    maxScore: number
    compliance: number
    performanceLevel: string
  }
  history: BonusHistoryPoint[]
}

export interface BonusFinding {
  id: string
  detectionDate: string
  departmentId: string
  department?: Department
  description: string
  cause: string | null
  impact: string | null
  responsibleId: string | null
  proposedAction: string | null
  status: string
  closeDate: string | null
  evidence: string | null
  createdAt: string
  updatedAt: string
}

export interface BonusImprovementAction {
  id: string
  findingId: string | null
  finding?: BonusFinding | null
  action: string
  responsibleId: string | null
  committedDate: string | null
  closeDate: string | null
  status: string
  evidence: string | null
  result: string | null
  indicatorBefore: string | null
  indicatorAfter: string | null
  resultValidated: boolean
  validatedById: string | null
  validatedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface BonusProcedure {
  id: string
  name: string
  departmentId: string
  department?: Department
  processId: string
  process?: Process
  identificationDate: string
  responsibleId: string | null
  analysisStatus: string
  draftingStatus: string
  validationStatus: string
  approvalDate: string | null
  diffusionDate: string | null
  version: string
  evidence: string | null
  createdAt: string
  updatedAt: string
}
