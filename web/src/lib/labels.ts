import type {
  ActionStatus,
  ActionType,
  FindingStatus,
  KpiFrequency,
  NonConformityStatus,
  OpportunityStatus,
  Priority,
  ProcedureStatus,
  RiskStatus,
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

export const NON_CONFORMITY_STATUS_LABELS: Record<NonConformityStatus, string> = {
  OPEN: 'Abierta',
  IN_TREATMENT: 'En tratamiento',
  CLOSED: 'Cerrada',
}

export const RISK_STATUS_LABELS: Record<RiskStatus, string> = {
  IDENTIFIED: 'Identificado',
  ASSESSED: 'Evaluado',
  IN_TREATMENT: 'En tratamiento',
  MONITORED: 'Monitoreado',
  CLOSED: 'Cerrado',
}

export const OPPORTUNITY_STATUS_LABELS: Record<OpportunityStatus, string> = {
  IDENTIFIED: 'Identificada',
  EVALUATED: 'Evaluada',
  IN_PROGRESS: 'En progreso',
  IMPLEMENTED: 'Implementada',
  CLOSED: 'Cerrada',
}

export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  CORRECTIVE: 'Correctiva',
  PREVENTIVE: 'Preventiva',
  IMPROVEMENT: 'Mejora',
}

export const ACTION_STATUS_LABELS: Record<ActionStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  DONE: 'Realizada',
  VERIFIED: 'Verificada',
  CANCELLED: 'Cancelada',
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
  ...NON_CONFORMITY_STATUS_LABELS,
  ...RISK_STATUS_LABELS,
  ...OPPORTUNITY_STATUS_LABELS,
  ...ACTION_TYPE_LABELS,
  ...ACTION_STATUS_LABELS,
  ...TASK_STATUS_LABELS,
  ...PROCEDURE_STATUS_LABELS,
  ...KPI_FREQUENCY_LABELS,
}
