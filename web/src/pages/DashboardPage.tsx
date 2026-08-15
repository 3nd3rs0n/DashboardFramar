import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { ALL } from '@/components/FilterBar'
import { Loading } from '@/components/Loading'
import { PageHeader } from '@/components/PageHeader'
import {
  useDashboardCharts,
  useDashboardSummary,
  useRelationOptions,
  type ListParams,
} from '@/api/hooks'
import { ENUM_LABELS } from '@/lib/labels'

const PIE_COLORS = ['#64748b', '#6366f1', '#10b981', '#a1a1aa', '#f59e0b']

interface SummaryCardProps {
  title: string
  value: number
  detail: string
}

function SummaryCard({ title, value, detail }: SummaryCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">{children}</CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const departments = useRelationOptions('departments')

  const params: ListParams = { from: from || undefined, to: to || undefined, departmentId: departmentId || undefined }
  const summary = useDashboardSummary(params)
  const charts = useDashboardCharts(params)

  if (summary.isPending) return <Loading />
  if (summary.isError)
    return <ErrorState message={summary.error.message} onRetry={() => summary.refetch()} />
  const s = summary.data
  const c = charts.data

  return (
    <div className="space-y-6">
      <PageHeader title="Panel Principal" description="Resumen ejecutivo del sistema de gestión" />

      <div className="flex flex-wrap items-center gap-2">
        <Input type="date" className="w-full sm:w-40" aria-label="Desde" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" className="w-full sm:w-40" aria-label="Hasta" value={to} onChange={(e) => setTo(e.target.value)} />
        <Select value={departmentId || ALL} onValueChange={(v) => setDepartmentId(v === ALL ? '' : v)}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los departamentos</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <SummaryCard title="Hallazgos" value={s.findings.total} detail={`${s.findings.open} abiertos · ${s.findings.overdue} vencidos`} />
        <SummaryCard title="No Conformidades" value={s.nonConformities.total} detail={`${s.nonConformities.open} abiertas`} />
        <SummaryCard title="Acciones" value={s.actions.total} detail={`${s.actions.pending} pendientes · ${s.actions.overdue} vencidas`} />
        <SummaryCard title="Tareas" value={s.tasks.total} detail={`${s.tasks.pending} pendientes · ${s.tasks.overdue} vencidas`} />
        <SummaryCard title="Procedimientos" value={s.procedures.total} detail={`${s.procedures.approved} aprobados`} />
        <SummaryCard title="Riesgos" value={s.risks.total} detail={`${s.risks.active} activos · ${s.risks.high} altos`} />
        <SummaryCard title="Oportunidades" value={s.opportunities.total} detail={`${s.opportunities.open} abiertas`} />
        <SummaryCard title="Indicadores" value={s.kpis.total} detail={`${s.kpis.offTarget} fuera de meta`} />
      </div>

      {charts.isPending ? (
        <Loading />
      ) : charts.isError || !c ? (
        <ErrorState message="No se pudieron cargar los gráficos" onRetry={() => charts.refetch()} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Hallazgos por mes">
            {c.findingsByMonth.length === 0 ? (
              <EmptyState message="Sin datos en el período" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={c.findingsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" name="Hallazgos" stroke="#6366f1" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Hallazgos por departamento">
            {c.findingsByDepartment.length === 0 ? (
              <EmptyState message="Sin datos en el período" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={c.findingsByDepartment}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" name="Hallazgos" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Tareas por estado">
            {c.tasksByStatus.length === 0 ? (
              <EmptyState message="Sin datos en el período" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={c.tasksByStatus}
                    dataKey="count"
                    nameKey="status"
                    outerRadius={90}
                    label={(props) => `${ENUM_LABELS[props.name as string] ?? props.name}: ${props.value}`}
                  >
                    {c.tasksByStatus.map((entry, index) => (
                      <Cell key={entry.status} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, ENUM_LABELS[name as string] ?? name]} />
                  <Legend formatter={(value) => ENUM_LABELS[value as string] ?? value} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Riesgos por nivel">
            {c.risksByLevel.length === 0 ? (
              <EmptyState message="Sin datos en el período" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={c.risksByLevel}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="level" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" name="Riesgos" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Cumplimiento de indicadores (último valor vs meta)">
            {c.kpiCompliance.length === 0 ? (
              <EmptyState message="Sin indicadores con valores" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={c.kpiCompliance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="kpi" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="latest" name="Último valor" fill="#10b981" />
                  <Bar dataKey="target" name="Meta" fill="#94a3b8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      )}
    </div>
  )
}
