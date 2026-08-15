import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import type {
  DashboardCharts,
  DashboardSummary,
  Department,
  KpiValue,
  ListResponse,
  Process,
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

// Options for relation selects
export interface Option {
  value: string
  label: string
}

export type RelationKind =
  | 'departments'
  | 'processes'
  | 'findings'
  | 'non-conformities'
  | 'risks'
  | 'opportunities'
  | 'actions'

interface TitledEntity {
  id: string
  title?: string
  name?: string
  process?: Process | null
  department?: Department | null
}

export function useRelationOptions(kind: RelationKind): Option[] {
  const query = useList<TitledEntity>(kind, { limit: 200 })
  return (query.data?.data ?? []).map((item) => {
    const base = item.title ?? item.name ?? item.id
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
