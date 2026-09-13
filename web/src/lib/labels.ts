import type {
  FindingStatus,
  KpiFrequency,
  Priority,
  ProcedureStatus,
  Role,
  TaskStatus,
} from '@/api/types'

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  ANALYST: 'Analista',
  VIEWER: 'Visualizador',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

export const FINDING_STATUS_LABELS: Record<FindingStatus, string> = {
  OPEN: 'Abierto',
  IN_ANALYSIS: 'En análisis',
  ACTION_DEFINED: 'Acción definida',
  IN_EXECUTION: 'En ejecución',
  PENDING_VERIFICATION: 'Pendiente de verificación',
  CLOSED: 'Cerrado',
  REOPENED: 'Reabierto',
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  DONE: 'Completada',
  CANCELLED: 'Cancelada',
}

export const PROCEDURE_STATUS_LABELS: Record<ProcedureStatus, string> = {
  DRAFT: 'Borrador',
  IN_REVIEW: 'En revisión',
  APPROVED: 'Aprobado',
  OBSOLETE: 'Obsoleto',
}

export const KPI_FREQUENCY_LABELS: Record<KpiFrequency, string> = {
  DAILY: 'Diaria',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  YEARLY: 'Anual',
}

// Any enum value → Spanish label (statuses, priorities, types, roles, frequencies).
export const ENUM_LABELS: Record<string, string> = {
  ...ROLE_LABELS,
  ...PRIORITY_LABELS,
  ...FINDING_STATUS_LABELS,
  ...TASK_STATUS_LABELS,
  ...PROCEDURE_STATUS_LABELS,
  ...KPI_FREQUENCY_LABELS,
  INFORMED: 'Informado',
  DOCUMENTED: 'Documentado',
  COMPLETED: 'Completado',
}
