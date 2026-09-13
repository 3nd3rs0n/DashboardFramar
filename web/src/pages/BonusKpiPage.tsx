import { useEffect, useState } from 'react'
import { z } from 'zod'
import { toast } from 'sonner'
import { ResourcePage, defaultToPayload, optionalDate, optionalText, requiredText } from '@/components/ResourcePage'
import type { FieldDef } from '@/components/EntityFormDialog'
import { StatusBadge } from '@/components/StatusBadge'
import type { BonusFinding, BonusImprovementAction, BonusKpiConfig, BonusProcedure, BonusThreshold } from '@/api/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/auth/AuthContext'
import { useBonusKpiConfigs, useUpdateBonusKpiConfig } from '@/api/hooks'

const findingStatuses = [
  { value: 'OPEN', label: 'Abierto' },
  { value: 'IN_ANALYSIS', label: 'En análisis' },
  { value: 'INFORMED', label: 'Informado' },
  { value: 'DOCUMENTED', label: 'Documentado' },
  { value: 'CLOSED', label: 'Cerrado' },
]
const actionStatuses = [
  { value: 'OPEN', label: 'Abierta' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'CLOSED', label: 'Cerrada' },
  { value: 'CANCELLED', label: 'Cancelada' },
]
const stageStatuses = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'COMPLETED', label: 'Completado' },
]
const validationOptions = [
  { value: 'false', label: 'No validado' },
  { value: 'true', label: 'Resultado validado' },
]
const findingFields: FieldDef[] = [
  { name: 'detectionDate', label: 'Fecha de detección', type: 'date', required: true },
  { name: 'departmentId', label: 'Departamento / área', type: 'relation', relation: 'departments', required: true },
  { name: 'description', label: 'Descripción', type: 'textarea', required: true },
  { name: 'cause', label: 'Causa', type: 'textarea' },
  { name: 'impact', label: 'Consecuencia / impacto', type: 'textarea' },
  { name: 'responsibleId', label: 'Responsable', type: 'text' },
  { name: 'proposedAction', label: 'Acción propuesta', type: 'textarea' },
  { name: 'status', label: 'Estado', type: 'select', options: findingStatuses, required: true },
  { name: 'closeDate', label: 'Fecha de cierre', type: 'date' },
  { name: 'evidence', label: 'Evidencia / documento', type: 'textarea' },
]

const findingSchema: z.ZodType<Record<string, string>, z.ZodTypeDef, Record<string, string>> = z.object({
  detectionDate: requiredText('Ingrese la fecha de detección'),
  departmentId: requiredText('Seleccione un departamento'),
  description: requiredText('Ingrese la descripción'),
  cause: optionalText(),
  impact: optionalText(),
  responsibleId: optionalText(),
  proposedAction: optionalText(),
  status: requiredText('Seleccione un estado'),
  closeDate: optionalDate(),
  evidence: optionalText(),
})

const actionFields: FieldDef[] = [
  { name: 'findingId', label: 'Hallazgo relacionado', type: 'relation', relation: 'bonus-kpis/findings', required: true },
  { name: 'action', label: 'Acción de mejora', type: 'textarea', required: true },
  { name: 'responsibleId', label: 'Responsable', type: 'text' },
  { name: 'committedDate', label: 'Fecha comprometida', type: 'date', required: true },
  { name: 'closeDate', label: 'Fecha de cierre', type: 'date' },
  { name: 'status', label: 'Estado', type: 'select', options: actionStatuses, required: true },
  { name: 'evidence', label: 'Evidencia', type: 'textarea' },
  { name: 'result', label: 'Resultado obtenido', type: 'textarea' },
  { name: 'indicatorBefore', label: 'Indicador antes', type: 'text' },
  { name: 'indicatorAfter', label: 'Indicador después', type: 'text' },
  { name: 'resultValidated', label: 'Validación del resultado', type: 'select', options: validationOptions, required: true },
]

const actionSchema: z.ZodType<Record<string, string>, z.ZodTypeDef, Record<string, string>> = z.object({
  findingId: requiredText('Seleccione un hallazgo'),
  action: requiredText('Ingrese la acción de mejora'),
  responsibleId: optionalText(),
  committedDate: requiredText('Ingrese la fecha comprometida'),
  closeDate: optionalDate(),
  status: requiredText('Seleccione un estado'),
  evidence: optionalText(),
  result: optionalText(),
  indicatorBefore: optionalText(),
  indicatorAfter: optionalText(),
  resultValidated: requiredText('Seleccione la validación'),
})

const procedureFields: FieldDef[] = [
  { name: 'name', label: 'Nombre', type: 'text', required: true },
  { name: 'departmentId', label: 'Departamento / área', type: 'relation', relation: 'departments', required: true },
  { name: 'processId', label: 'Proceso', type: 'relation', relation: 'processes', required: true },
  { name: 'identificationDate', label: 'Fecha de identificación', type: 'date', required: true },
  { name: 'responsibleId', label: 'Responsable', type: 'text' },
  { name: 'analysisStatus', label: 'Estado de análisis', type: 'select', options: stageStatuses, required: true },
  { name: 'draftingStatus', label: 'Estado de redacción', type: 'select', options: stageStatuses, required: true },
  { name: 'validationStatus', label: 'Estado de validación', type: 'select', options: stageStatuses, required: true },
  { name: 'approvalDate', label: 'Fecha de aprobación', type: 'date' },
  { name: 'diffusionDate', label: 'Fecha de difusión', type: 'date' },
  { name: 'version', label: 'Versión', type: 'text', required: true },
  { name: 'evidence', label: 'Documento / evidencia asociado', type: 'textarea' },
]

const procedureSchema: z.ZodType<Record<string, string>, z.ZodTypeDef, Record<string, string>> = z.object({
  name: requiredText('Ingrese el nombre'),
  departmentId: requiredText('Seleccione un departamento'),
  processId: requiredText('Seleccione un proceso'),
  identificationDate: requiredText('Ingrese la fecha de identificación'),
  responsibleId: optionalText(),
  analysisStatus: requiredText('Seleccione el estado de análisis'),
  draftingStatus: requiredText('Seleccione el estado de redacción'),
  validationStatus: requiredText('Seleccione el estado de validación'),
  approvalDate: optionalDate(),
  diffusionDate: optionalDate(),
  version: requiredText('Ingrese la versión'),
  evidence: optionalText(),
})

function stageLabel(value: string): string {
  return value === 'COMPLETED' ? 'Completado' : 'Pendiente'
}

function BonusConfigEditor({
  config,
  open,
  onOpenChange,
}: {
  config: BonusKpiConfig | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const updateMutation = useUpdateBonusKpiConfig(config?.key ?? '')
  const [maxPoints, setMaxPoints] = useState('')
  const [thresholds, setThresholds] = useState<BonusThreshold[]>([])

  useEffect(() => {
    if (!config) return
    setMaxPoints(String(config.maxPoints))
    setThresholds(config.thresholds.map((threshold) => ({ ...threshold })))
  }, [config])

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!config) return
    updateMutation.mutate(
      { maxPoints: Number(maxPoints), thresholds },
      {
        onSuccess: () => { onOpenChange(false); toast.success('Configuración actualizada') },
        onError: (error: Error) => toast.error(error.message),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Configurar {config?.name}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <label className="grid gap-1 text-sm font-medium">Puntaje máximo
            <Input type="number" min={1} value={maxPoints} onChange={(event) => setMaxPoints(event.target.value)} required />
          </label>
          <div className="space-y-2">
            <p className="text-sm font-medium">Niveles de puntaje</p>
            {thresholds.map((threshold, index) => (
              <div key={`${threshold.minCount}-${index}`} className="flex items-end gap-2">
                <label className="grid flex-1 gap-1 text-xs text-muted-foreground">Registros mínimos
                  <Input type="number" min={0} value={threshold.minCount} onChange={(event) => setThresholds((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, minCount: Number(event.target.value) } : item))} />
                </label>
                <label className="grid flex-1 gap-1 text-xs text-muted-foreground">Puntos
                  <Input type="number" min={0} value={threshold.points} onChange={(event) => setThresholds((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, points: Number(event.target.value) } : item))} />
                </label>
                <Button type="button" variant="ghost" size="sm" disabled={thresholds.length <= 1} onClick={() => setThresholds((items) => items.filter((_, itemIndex) => itemIndex !== index))}>Quitar</Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setThresholds((items) => [...items, { minCount: (items.at(-1)?.minCount ?? 0) + 1, points: (items.at(-1)?.points ?? 0) + 1 }])}>Agregar nivel</Button>
          </div>
          <DialogFooter><Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? 'Guardando...' : 'Guardar configuración'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function BonusConfigPanel() {
  const { user } = useAuth()
  const configQuery = useBonusKpiConfigs()
  const [editing, setEditing] = useState<BonusKpiConfig | null>(null)
  if (user?.role !== 'ADMIN') return null
  return (
    <>
      <Card><CardContent className="space-y-3 p-4">
        <div><p className="font-semibold">Configuración de umbrales</p><p className="text-xs text-muted-foreground">Los rangos y puntajes se almacenan como configuración, no en el código.</p></div>
        <div className="flex flex-wrap gap-2">
          {configQuery.data?.map((config) => <Button key={config.key} variant="outline" size="sm" onClick={() => setEditing(config)}>Configurar {config.name}</Button>)}
        </div>
      </CardContent></Card>
      <BonusConfigEditor config={editing} open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} />
    </>
  )
}

function BonusDataPage() {
  const [tab, setTab] = useState<'findings' | 'actions' | 'procedures'>('findings')
  return (
    <div className="space-y-4">
      <Card><CardContent className="flex flex-wrap gap-2 p-3">
        <Button variant={tab === 'findings' ? 'default' : 'outline'} onClick={() => setTab('findings')}>Gestión de hallazgos</Button>
        <Button variant={tab === 'actions' ? 'default' : 'outline'} onClick={() => setTab('actions')}>Acciones de mejora</Button>
        <Button variant={tab === 'procedures' ? 'default' : 'outline'} onClick={() => setTab('procedures')}>Gestión de procedimientos</Button>
      </CardContent></Card>
      {tab === 'findings' && <ResourcePage<BonusFinding>
        resource="bonus-kpis/findings"
        title="Gestión de Hallazgos"
        description="Registra hallazgos válidos y su evidencia para el cálculo mensual."
        createLabel="Nuevo hallazgo"
        entityLabel="hallazgo"
        emptyMessage="No hay hallazgos de bonificación registrados"
        searchPlaceholder="Buscar por descripción..."
        fields={findingFields}
        schema={findingSchema}
        defaultValues={{ detectionDate: '', departmentId: '', description: '', cause: '', impact: '', responsibleId: '', proposedAction: '', status: 'OPEN', closeDate: '', evidence: '' }}
        filters={[{ name: 'departmentId', label: 'Departamento', type: 'relation', relation: 'departments' }, { name: 'status', label: 'Estado', type: 'select', options: findingStatuses }]}
        columns={[
          { header: 'Fecha', cell: (item) => formatDate(item.detectionDate) },
          { header: 'Descripción', cell: (item) => <span className="font-medium">{item.description}</span> },
          { header: 'Departamento', cell: (item) => item.department?.name ?? '—' },
          { header: 'Estado', cell: (item) => <StatusBadge value={item.status} /> },
          { header: 'Evidencia', cell: (item) => item.evidence ? 'Sí' : 'No' },
        ]}
      />}
      {tab === 'actions' && <ResourcePage<BonusImprovementAction>
        resource="bonus-kpis/actions"
        title="Cierre de Acciones de Mejora Continua"
        description="Una acción solo suma cuando está cerrada, documentada y validada."
        createLabel="Nueva acción"
        entityLabel="acción de mejora"
        emptyMessage="No hay acciones de mejora registradas"
        searchPlaceholder="Buscar por acción..."
        fields={actionFields}
        schema={actionSchema}
        defaultValues={{ findingId: '', action: '', responsibleId: '', committedDate: '', closeDate: '', status: 'OPEN', evidence: '', result: '', indicatorBefore: '', indicatorAfter: '', resultValidated: 'false' }}
        toPayload={(values) => ({ ...defaultToPayload(actionFields, values), resultValidated: values.resultValidated === 'true' })}
        filters={[{ name: 'status', label: 'Estado', type: 'select', options: actionStatuses }, { name: 'findingId', label: 'Hallazgo', type: 'relation', relation: 'bonus-kpis/findings' }]}
        columns={[
          { header: 'Acción', cell: (item) => <span className="font-medium">{item.action}</span> },
          { header: 'Hallazgo', cell: (item) => item.finding?.description?.slice(0, 45) ?? '—' },
          { header: 'Cierre', cell: (item) => formatDate(item.closeDate) },
          { header: 'Estado', cell: (item) => <StatusBadge value={item.status} /> },
          { header: 'Validado', cell: (item) => item.resultValidated ? 'Sí' : 'No' },
        ]}
      />}
      {tab === 'procedures' && <ResourcePage<BonusProcedure>
        resource="bonus-kpis/procedures"
        title="Gestión de Procedimientos"
        description="Completa Detectado → Analizado → Redactado → Validado → Difundido."
        createLabel="Nuevo procedimiento"
        entityLabel="procedimiento"
        emptyMessage="No hay procedimientos de bonificación registrados"
        searchPlaceholder="Buscar por nombre..."
        fields={procedureFields}
        schema={procedureSchema}
        defaultValues={{ name: '', departmentId: '', processId: '', identificationDate: '', responsibleId: '', analysisStatus: 'PENDING', draftingStatus: 'PENDING', validationStatus: 'PENDING', approvalDate: '', diffusionDate: '', version: '1.0', evidence: '' }}
        filters={[{ name: 'departmentId', label: 'Departamento', type: 'relation', relation: 'departments' }, { name: 'processId', label: 'Proceso', type: 'relation', relation: 'processes' }]}
        columns={[
          { header: 'Nombre', cell: (item) => <span className="font-medium">{item.name}</span> },
          { header: 'Departamento', cell: (item) => item.department?.name ?? '—' },
          { header: 'Proceso', cell: (item) => item.process?.name ?? '—' },
          { header: 'Flujo', cell: (item) => `${stageLabel(item.analysisStatus)} · ${stageLabel(item.draftingStatus)} · ${stageLabel(item.validationStatus)}` },
          { header: 'Difusión', cell: (item) => formatDate(item.diffusionDate) },
          { header: 'Evidencia', cell: (item) => item.evidence ? 'Sí' : 'No' },
        ]}
      />}
    </div>
  )
}

export function BonusKpiPage() {
  return <div className="space-y-4"><BonusConfigPanel /><BonusDataPage /></div>
}
