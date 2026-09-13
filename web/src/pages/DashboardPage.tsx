import { useState } from 'react'
import {
  Activity,
  AlertCircle,
  BarChart3,
  Building2,
  CalendarRange,
  CheckCircle2,
  ClipboardList,
  Download,
  FileCheck,
  PieChart as PieChartIcon,
} from 'lucide-react'
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
import { BonusKpiSection } from '@/components/BonusKpiSection'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Loading } from '@/components/Loading'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ALL } from '@/components/FilterBar'
import { useDashboardCharts, useDashboardSummary, useRelationOptions, type ListParams } from '@/api/hooks'
import { ENUM_LABELS } from '@/lib/labels'
import { download } from '@/api/client'
import { toast } from 'sonner'

const PIE_COLORS = ['#64748b', '#6366f1', '#10b981', '#f59e0b']

function SummaryMetric({ icon: Icon, label, value, detail, tone }: {
  icon: typeof Activity
  label: string
  value: number
  detail: string
  tone: string
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-xl p-2.5 ${tone}`}><Icon className="h-5 w-5" /></div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{detail}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function ChartCard({ title, icon: Icon, children }: { title: string; icon: typeof Activity; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
        <Icon className="h-4 w-4 text-primary" />
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-80">{children}</CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const departments = useRelationOptions('departments')
  const params: ListParams = { from: from || undefined, to: to || undefined, departmentId: departmentId || undefined }
  const summary = useDashboardSummary(params)
  const charts = useDashboardCharts(params)
  const hasFilters = Boolean(from || to || departmentId)

  async function handleExport() {
    setIsExporting(true)
    try {
      const query = new URLSearchParams()
      if (from) query.set('from', from)
      if (to) query.set('to', to)
      if (departmentId) query.set('departmentId', departmentId)

      const blob = await download(`/dashboard/export${query.toString() ? `?${query}` : ''}`)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `dashboard-${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      toast.success('Excel descargado correctamente')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo descargar el Excel')
    } finally {
      setIsExporting(false)
    }
  }

  if (summary.isPending) return <Loading />
  if (summary.isError) return <ErrorState message={summary.error.message} onRetry={() => summary.refetch()} />

  const s = summary.data
  const c = charts.data

  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel Principal"
        description="Vista operativa de tareas y hallazgos"
        action={<Button variant="outline" onClick={handleExport} disabled={isExporting}><Download />{isExporting ? 'Generando...' : 'Descargar Excel'}</Button>}
      />

      <Card className="border-primary/10 bg-card shadow-sm">
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
          <div className="flex items-center gap-2 text-sm font-semibold lg:mr-2"><CalendarRange className="h-4 w-4 text-primary" /> Filtros del tablero</div>
          <label className="grid flex-1 gap-1 text-xs font-medium text-muted-foreground">Desde
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label className="grid flex-1 gap-1 text-xs font-medium text-muted-foreground">Hasta
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </label>
          <label className="grid flex-1 gap-1 text-xs font-medium text-muted-foreground">Departamento
            <Select value={departmentId || ALL} onValueChange={(value) => setDepartmentId(value === ALL ? '' : value)}>
              <SelectTrigger><SelectValue placeholder="Todos los departamentos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos los departamentos</SelectItem>
                {departments.map((department) => <SelectItem key={department.value} value={department.value}>{department.label}</SelectItem>)}
              </SelectContent>
           </Select>
          </label>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFrom('')
                setTo('')
                setDepartmentId('')
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryMetric icon={ClipboardList} label="Tareas registradas" value={s.tasks.total} detail={`${s.tasks.pending} pendientes o en progreso`} tone="bg-indigo-100 text-indigo-700" />
        <SummaryMetric icon={CheckCircle2} label="Tareas pendientes" value={s.tasks.pending} detail={`${s.tasks.overdue} vencidas`} tone="bg-amber-100 text-amber-700" />
        <SummaryMetric icon={Activity} label="Hallazgos realizados" value={s.findings.total} detail={`${s.findings.open} abiertos`} tone="bg-sky-100 text-sky-700" />
        <SummaryMetric icon={AlertCircle} label="Hallazgos vencidos" value={s.findings.overdue} detail="Requieren seguimiento" tone="bg-red-100 text-red-700" />
        <SummaryMetric icon={FileCheck} label="Procedimientos registrados" value={s.procedures.total} detail={`${s.procedures.approved} aprobados`} tone="bg-emerald-100 text-emerald-700" />
      </div>

      {charts.isPending ? (
        <Loading />
      ) : charts.isError || !c ? (
        <ErrorState message="No se pudieron cargar los gráficos operativos" onRetry={() => charts.refetch()} />
      ) : (
        <div className="space-y-6">
          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Actividad operativa</h2>
              <p className="text-sm text-muted-foreground">Seguimiento de tareas y hallazgos en el periodo seleccionado.</p>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <ChartCard title="Tareas por estado" icon={PieChartIcon}>
                {c.tasksByStatus.length === 0 ? <EmptyState message="Sin tareas en el período" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={c.tasksByStatus} dataKey="count" nameKey="status" innerRadius={58} outerRadius={96} paddingAngle={3} label={(props) => `${ENUM_LABELS[props.name as string] ?? props.name}: ${props.value}`}>
                        {c.tasksByStatus.map((entry, index) => <Cell key={entry.status} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, ENUM_LABELS[name as string] ?? name]} />
                      <Legend formatter={(value) => ENUM_LABELS[value as string] ?? value} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <ChartCard title="Hallazgos realizados por mes" icon={BarChart3}>
                {c.findingsByMonth.length === 0 ? <EmptyState message="Sin hallazgos en el período" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={c.findingsByMonth} margin={{ left: 4, right: 12 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" fontSize={12} />
                      <YAxis allowDecimals={false} fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" name="Hallazgos" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <div className="xl:col-span-2">
                <ChartCard title="Hallazgos por departamento" icon={Building2}>
                  {c.findingsByDepartment.length === 0 ? <EmptyState message="Sin hallazgos por departamento" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={c.findingsByDepartment} layout="vertical" margin={{ left: 12, right: 18 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} fontSize={12} />
                        <YAxis type="category" dataKey="department" width={110} fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="count" name="Hallazgos" fill="#0ea5e9" radius={[0, 5, 5, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Documentación y cumplimiento</h2>
              <p className="text-sm text-muted-foreground">Estado y distribución de los procedimientos registrados.</p>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="xl:col-span-2">
                <ChartCard title="Procedimientos por mes y estado" icon={FileCheck}>
                  {c.proceduresByMonth.length === 0 ? <EmptyState message="Sin procedimientos aprobados en el período" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={c.proceduresByMonth} layout="horizontal" barCategoryGap="18%" barGap={3} margin={{ top: 24, left: 8, right: 12, bottom: 12 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" type="category" label={{ value: 'Mes', position: 'insideBottom', offset: -4 }} fontSize={12} />
                        <YAxis type="number" allowDecimals={false} label={{ value: 'Cantidad', angle: -90, position: 'insideLeft' }} fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="APPROVED" name="Aprobado" fill="#059669" radius={[5, 5, 0, 0]} label={{ position: 'top', fontSize: 11, fill: '#047857' }} />
                        <Bar dataKey="DRAFT" name="Borrador" fill="#94a3b8" radius={[5, 5, 0, 0]} label={{ position: 'top', fontSize: 11, fill: '#475569' }} />
                        <Bar dataKey="IN_REVIEW" name="En revisión" fill="#f59e0b" radius={[5, 5, 0, 0]} label={{ position: 'top', fontSize: 11, fill: '#b45309' }} />
                        <Bar dataKey="OBSOLETE" name="Obsoleto" fill="#71717a" radius={[5, 5, 0, 0]} label={{ position: 'top', fontSize: 11, fill: '#52525b' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              </div>
            </div>
          </section>
        </div>
      )}

      <BonusKpiSection from={from} to={to} departmentId={departmentId} />
    </div>
  )
}
