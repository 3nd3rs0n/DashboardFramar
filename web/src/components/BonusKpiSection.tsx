import {
  AlertTriangle,
  Award,
  CheckCircle2,
  CircleAlert,
} from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useBonusKpiDashboard } from '@/api/hooks'
import type { BonusMetricResult } from '@/api/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState } from '@/components/ErrorState'
import { Loading } from '@/components/Loading'

const METRIC_COLORS: Record<string, string> = {
  FINDINGS_MANAGEMENT: '#2563eb',
  CONTINUOUS_IMPROVEMENT: '#7c3aed',
  PROCEDURES_MANAGEMENT: '#059669',
}

function thresholdLabel(threshold: { minCount: number; points: number } | null): string {
  return threshold ? `${threshold.minCount} registros · ${threshold.points} pts` : 'Máximo alcanzado'
}

const metricCalculationSummaries: Record<string, string> = {
  FINDINGS_MANAGEMENT: 'Cuenta los hallazgos registrados en el periodo y asigna puntos según el umbral alcanzado.',
  CONTINUOUS_IMPROVEMENT: 'Cuenta los cierres de acciones de mejora con resultado y evidencia, asignando puntos por umbral.',
  PROCEDURES_MANAGEMENT: 'Cuenta los procedimientos aprobados en el periodo y asigna puntos según los umbrales configurados.',
}

function CalculationHint({ metric }: { metric: BonusMetricResult }) {
  const summary = metricCalculationSummaries[metric.key] ?? 'El puntaje se calcula según los registros válidos y los umbrales configurados.'
  return (
    <span
      tabIndex={0}
      aria-label={`Cómo se calcula ${metric.name}`}
      className="group relative inline-flex rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <CircleAlert className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
      <span className="pointer-events-none invisible absolute right-0 top-7 z-50 w-72 rounded-lg border bg-popover p-3 text-left text-xs font-normal text-popover-foreground opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100">
        <strong className="font-semibold">Cómo se calcula</strong>
        <span className="mt-1 block">{summary}</span>
        <span className="mt-2 block border-t pt-2 text-muted-foreground">{metric.traceability.calculation}</span>
      </span>
    </span>
  )
}

function BonusMetricCard({ metric }: { metric: BonusMetricResult }) {
  const hasNext = metric.nextTarget !== null
  return (
    <Card className="overflow-visible">
      <div className="h-1" style={{ backgroundColor: METRIC_COLORS[metric.key] ?? '#64748b' }} />
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base leading-5">{metric.name}</CardTitle>
          {metric.score === metric.maxPoints ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <CalculationHint metric={metric} />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Resultado actual</p>
            <p className="text-3xl font-bold">{metric.count}</p>
            <p className="text-xs text-muted-foreground">registros válidos</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Puntaje</p>
            <p className="text-2xl font-bold">{metric.score} <span className="text-sm font-normal text-muted-foreground">/ {metric.maxPoints}</span></p>
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Avance</span><span>{metric.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full transition-all" style={{ width: `${metric.progress}%`, backgroundColor: METRIC_COLORS[metric.key] ?? '#64748b' }} />
          </div>
        </div>
        <div className="grid gap-2 text-xs">
          <div className="flex justify-between gap-3"><span className="text-muted-foreground">Meta alcanzada</span><strong>{thresholdLabel(metric.targetReached)}</strong></div>
          <div className="flex justify-between gap-3"><span className="text-muted-foreground">Próxima meta</span><strong>{thresholdLabel(metric.nextTarget)}</strong></div>
          <div className={`flex items-center gap-1.5 ${hasNext ? 'text-amber-700' : 'text-emerald-700'}`}>
            {hasNext ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            <span>{hasNext ? `Faltan ${metric.missingForNext} registros para el siguiente nivel` : 'Puntaje máximo alcanzado'}</span>
          </div>
        </div>
        <details className="rounded-lg border bg-muted/30 p-3 text-xs">
          <summary className="cursor-pointer font-medium">Trazabilidad del resultado</summary>
          <div className="mt-2 space-y-1 text-muted-foreground">
            <p>Datos utilizados: <strong className="text-foreground">{metric.traceability.dataUsed}</strong> registros</p>
            <p>Evidencia: <strong className="text-foreground">{metric.traceability.evidenceCount}</strong> registros</p>
            <p>Cálculo: {metric.traceability.calculation}</p>
            <p>IDs utilizados: {metric.traceability.recordIds.length || 'Ninguno'}</p>
          </div>
        </details>
      </CardContent>
    </Card>
  )
}

function periodFromFilters(from?: string, to?: string): { year: number; month: number } {
  const source = to || from
  if (source) {
    const [year, month] = source.split('-').map(Number)
    if (year >= 2000 && month >= 1 && month <= 12) return { year, month }
  }
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export function BonusKpiSection({
  from,
  to,
  departmentId,
}: {
  from?: string
  to?: string
  departmentId?: string
}) {
  const { year, month } = periodFromFilters(from, to)
  const query = useBonusKpiDashboard(year, month, { from, to, departmentId })

  if (query.isPending) return <Loading />
  if (query.isError) return <ErrorState message="No se pudo cargar el KPI de bonificación" onRetry={() => query.refetch()} />

  const dashboard = query.data
  const scoreLimit = Math.max(dashboard.summary.maxScore, 1)
  const scoreReached = Math.min(dashboard.summary.currentScore, scoreLimit)
  const scoreData = [
    { name: 'Puntos obtenidos', value: scoreReached },
    { name: 'Puntos restantes', value: Math.max(scoreLimit - scoreReached, 0) },
  ]
  const chartData = dashboard.history.map((point) => ({
    period: point.period,
    totalScore: point.totalScore,
    findings: point.kpis.find((metric) => metric.key === 'FINDINGS_MANAGEMENT')?.score ?? 0,
    actions: point.kpis.find((metric) => metric.key === 'CONTINUOUS_IMPROVEMENT')?.score ?? 0,
    procedures: point.kpis.find((metric) => metric.key === 'PROCEDURES_MANAGEMENT')?.score ?? 0,
  }))

  return (
    <section className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary"><Award className="h-4 w-4" /> Incentivos</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">KPI DE BONIFICACIÓN</h2>
          <p className="text-sm text-muted-foreground">Seguimiento integrado con los filtros del panel principal.</p>
        </div>
        <span className="text-xs text-muted-foreground">Periodo: {dashboard.period}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardContent className="flex h-full flex-col justify-between gap-5 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Resumen general · {dashboard.period}</p>
                <div className="mt-3 flex items-end gap-2"><span className="text-5xl font-bold">{dashboard.summary.currentScore}</span><span className="mb-1 text-xl text-muted-foreground">/ {dashboard.summary.maxScore}</span></div>
                <p className="mt-1 text-sm font-semibold">PUNTAJE ACTUAL</p>
              </div>
              <div className="h-36 w-36 shrink-0" aria-label={`Progreso de puntaje: ${dashboard.summary.compliance}%`}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={scoreData} dataKey="value" nameKey="name" innerRadius={46} outerRadius={64} startAngle={90} endAngle={-270} strokeWidth={0}>
                      <Cell fill="#0f766e" />
                      <Cell fill="#d1fae5" />
                    </Pie>
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#0f766e" fontSize="20" fontWeight="700">
                      {dashboard.summary.compliance}%
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-background p-3"><p className="text-xs text-muted-foreground">Cumplimiento</p><p className="mt-1 text-xl font-bold">{dashboard.summary.compliance}%</p></div>
              <div className="rounded-lg bg-background p-3"><p className="text-xs text-muted-foreground">Desempeño</p><p className="mt-1 font-bold">{dashboard.summary.performanceLevel}</p></div>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-3">
          {dashboard.kpis.map((metric) => <BonusMetricCard key={metric.key} metric={metric} />)}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Evolución mensual por KPI</CardTitle></CardHeader>
          <CardContent className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="period" fontSize={11} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Legend /><Line type="monotone" dataKey="findings" name="Hallazgos" stroke={METRIC_COLORS.FINDINGS_MANAGEMENT} strokeWidth={2} /><Line type="monotone" dataKey="actions" name="Acciones" stroke={METRIC_COLORS.CONTINUOUS_IMPROVEMENT} strokeWidth={2} /><Line type="monotone" dataKey="procedures" name="Procedimientos" stroke={METRIC_COLORS.PROCEDURES_MANAGEMENT} strokeWidth={2} /></LineChart></ResponsiveContainer></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Puntaje total mensual</CardTitle></CardHeader>
          <CardContent className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="period" fontSize={11} /><YAxis allowDecimals={false} domain={[0, dashboard.summary.maxScore]} fontSize={12} /><Tooltip /><Bar dataKey="totalScore" name="Puntaje total" fill="#0f766e" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></CardContent>
        </Card>
      </div>

      <div className="rounded-xl border border-dashed bg-card px-4 py-3 text-sm">
        <span className="text-muted-foreground">Los resultados se calculan con hallazgos y procedimientos registrados.</span>
      </div>
    </section>
  )
}
