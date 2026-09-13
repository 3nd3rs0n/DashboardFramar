import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type {
  BonusDashboard,
  BonusKpiConfig,
  DashboardCharts,
  DashboardSummary,
  Department,
  FindingComment,
  FindingHistoryEntry,
  FindingParticipant,
  KpiValue,
  ListResponse,
  Process,
  ProcedureComment,
  ProcedureHistoryEntry,
  TaskComment,
  TaskHistoryEntry,
  User,
} from '@/api/types'

export interface ListParams {
  page?: number
  limit?: number
  search?: string
  [key: string]: string | number | undefined
}

function queryString(params: ListParams): string {
  const sp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') sp.set(key, String(value))
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export function useList<T>(resource: string, params: ListParams = {}) {
  return useQuery({
    queryKey: [resource, 'list', params],
    queryFn: () => api<ListResponse<T>>(`/${resource}${queryString(params)}`),
    placeholderData: keepPreviousData,
  })
}

export function useOne<T>(resource: string, id: string | null) {
  return useQuery({
    queryKey: [resource, 'one', id],
    queryFn: () => api<T>(`/${resource}/${id}`),
    enabled: id !== null,
  })
}

function useInvalidator(resource: string) {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: [resource] })
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }
}

export function useCreate<T>(resource: string) {
  const invalidate = useInvalidator(resource)
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api<T>(`/${resource}`, { method: 'POST', body }),
    onSuccess: invalidate,
  })
}

export function useUpdate<T>(resource: string) {
  const invalidate = useInvalidator(resource)
  return useMutation({
    mutationFn: ({ id, ...body }: Record<string, unknown> & { id: string }) =>
      api<T>(`/${resource}/${id}`, { method: 'PATCH', body }),
    onSuccess: invalidate,
  })
}

export function useDelete(resource: string) {
  const invalidate = useInvalidator(resource)
  return useMutation({
    mutationFn: (id: string) => api<undefined>(`/${resource}/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}

export function useProcedureHistory(procedureId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['procedures', 'history', procedureId],
    queryFn: () => api<ProcedureHistoryEntry[]>(`/procedures/${procedureId}/history`),
    enabled: procedureId !== null && enabled,
  })
}

export function useProcedureComments(procedureId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['procedures', 'comments', procedureId],
    queryFn: () => api<ProcedureComment[]>(`/procedures/${procedureId}/comments`),
    enabled: procedureId !== null && enabled,
  })
}

export function useCreateProcedureComment(procedureId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { body: string }) =>
      api<ProcedureComment>(`/procedures/${procedureId}/comments`, { method: 'POST', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['procedures', 'comments', procedureId] })
      void queryClient.invalidateQueries({ queryKey: ['procedures', 'list'] })
    },
  })
}

export function useTaskHistory(taskId: string | null) {
  return useQuery({
    queryKey: ['tasks', 'history', taskId],
    queryFn: () => api<TaskHistoryEntry[]>(`/tasks/${taskId}/history`),
    enabled: taskId !== null,
  })
}

export function useTaskComments(taskId: string | null) {
  return useQuery({
    queryKey: ['tasks', 'comments', taskId],
    queryFn: () => api<TaskComment[]>(`/tasks/${taskId}/comments`),
    enabled: taskId !== null,
  })
}

export function useCreateTaskComment(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { body: string }) =>
      api<TaskComment>(`/tasks/${taskId}/comments`, { method: 'POST', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks', 'comments', taskId] })
      void queryClient.invalidateQueries({ queryKey: ['tasks', 'list'] })
    },
  })
}

export function useFindingHistory(findingId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['findings', 'history', findingId],
    queryFn: () => api<FindingHistoryEntry[]>(`/findings/${findingId}/history`),
    enabled: findingId !== null && enabled,
  })
}

export function useFindingComments(findingId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['findings', 'comments', findingId],
    queryFn: () => api<FindingComment[]>(`/findings/${findingId}/comments`),
    enabled: findingId !== null && enabled,
  })
}

export function useFindingParticipants(findingId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['findings', 'participants', findingId],
    queryFn: () => api<FindingParticipant[]>(`/findings/${findingId}/participants`),
    enabled: findingId !== null && enabled,
  })
}

export function useCreateFindingComment(findingId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { body: string }) =>
      api<FindingComment>(`/findings/${findingId}/comments`, { method: 'POST', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['findings', 'comments', findingId] })
      void queryClient.invalidateQueries({ queryKey: ['findings', 'list'] })
    },
  })
}

export function useAddFindingParticipant(findingId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { userId: string }) =>
      api<FindingParticipant>(`/findings/${findingId}/participants`, { method: 'POST', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['findings', 'participants', findingId] })
    },
  })
}

export function useRemoveFindingParticipant(findingId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) =>
      api<undefined>(`/findings/${findingId}/participants/${userId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['findings', 'participants', findingId] })
    },
  })
}

export function useUsers(enabled = true) {
  return useQuery({
    queryKey: ['auth', 'users'],
    queryFn: () => api<User[]>('/auth/users'),
    enabled,
  })
}

// Options for relation selects
export interface Option {
  value: string
  label: string
}

export type RelationKind =
  | 'departments'
  | 'processes'
  | 'findings'
  | 'bonus-kpis/findings'

interface TitledEntity {
  id: string
  title?: string
  name?: string
  description?: string
  process?: Process | null
  department?: Department | null
}

export function useRelationOptions(kind: RelationKind): Option[] {
  const query = useList<TitledEntity>(kind, { limit: 100 })
  return (query.data?.data ?? []).map((item) => {
    const base = item.title ?? item.name ?? item.description?.slice(0, 60) ?? item.id
    const context = item.process?.department?.name ?? item.department?.name
    return { value: item.id, label: context ? `${base} (${context})` : base }
  })
}

// Dashboard
export function useDashboardSummary(params: ListParams) {
  return useQuery({
    queryKey: ['dashboard', 'summary', params],
    queryFn: () => api<DashboardSummary>(`/dashboard/summary${queryString(params)}`),
  })
}

export function useDashboardCharts(params: ListParams) {
  return useQuery({
    queryKey: ['dashboard', 'charts', params],
    queryFn: () => api<DashboardCharts>(`/dashboard/charts${queryString(params)}`),
  })
}

export function useBonusKpiDashboard(year: number, month: number, filters: { from?: string; to?: string; departmentId?: string } = {}) {
  return useQuery({
    queryKey: ['bonus-kpis', 'dashboard', year, month, filters],
    queryFn: () => {
      const params = new URLSearchParams({ year: String(year), month: String(month) })
      if (filters.from) params.set('from', filters.from)
      if (filters.to) params.set('to', filters.to)
      if (filters.departmentId) params.set('departmentId', filters.departmentId)
      return api<BonusDashboard>(`/bonus-kpis/dashboard?${params}`)
    },
  })
}

export function useBonusKpiConfigs() {
  return useQuery({
    queryKey: ['bonus-kpis', 'config'],
    queryFn: () => api<BonusKpiConfig[]>('/bonus-kpis/config'),
  })
}

export function useUpdateBonusKpiConfig(key: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { name?: string; description?: string; maxPoints?: number; thresholds?: { minCount: number; points: number }[] }) =>
      api<BonusKpiConfig>(`/bonus-kpis/config/${key}`, { method: 'PATCH', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['bonus-kpis'] })
    },
  })
}

// KPI values
export function useKpiValues(kpiId: string | null) {
  return useQuery({
    queryKey: ['kpis', 'values', kpiId],
    queryFn: () => api<KpiValue[]>(`/kpis/${kpiId}/values`),
    enabled: kpiId !== null,
  })
}

export function useCreateKpiValue(kpiId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api<KpiValue>(`/kpis/${kpiId}/values`, { method: 'POST', body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['kpis'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteKpiValue(kpiId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (valueId: string) =>
      api<undefined>(`/kpis/${kpiId}/values/${valueId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['kpis'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
