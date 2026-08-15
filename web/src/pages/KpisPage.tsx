import { useState } from 'react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Pencil, Plus, Table, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DataTable, type Column } from '@/components/DataTable'
import { EmptyState } from '@/components/EmptyState'
import { EntityFormDialog, type FieldDef } from '@/components/EntityFormDialog'
import { ErrorState } from '@/components/ErrorState'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Loading } from '@/components/Loading'
import { PageHeader } from '@/components/PageHeader'
import { StatusBadge } from '@/components/StatusBadge'
import {
  useCreate,
  useCreateKpiValue,
  useDelete,
  useDeleteKpiValue,
  useKpiValues,
  useList,
  useUpdate,
} from '@/api/hooks'
import type { Kpi, KpiValue } from '@/api/types'
import { KPI_FREQUENCIES } from '@/api/types'
import { KPI_FREQUENCY_LABELS } from '@/lib/labels'
import { enumOptions } from '@/components/ResourcePage'
import { formatDate } from '@/lib/utils'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const frequencyOptions = enumOptions(KPI_FREQUENCIES, KPI_FREQUENCY_LABELS)

const fields: FieldDef[] = [
  { name: 'name', label: 'Nombre', type: 'text', required: true },
  { name: 'unit', label: 'Unidad', type: 'text', placeholder: '%' },
  { name: 'target', label: 'Meta', type: 'number', required: true },
  { name: 'frequency', label: 'Frecuencia', type: 'select', options: frequencyOptions, required: true },
  { name: 'processId', label: 'Proceso', type: 'relation', relation: 'processes', required: true },
  { name: 'responsibleId', label: 'Responsable', type: 'text' },
  { name: 'description', label: 'Descripción', type: 'textarea' },
  { name: 'formula', label: 'Fórmula', type: 'text', placeholder: 'cerradas / totales * 100' },
]

const kpiSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  unit: z.string(),
  target: z.string().min(1, 'La meta es obligatoria').refine((v) => !Number.isNaN(Number(v)), 'Debe ser un número'),
  frequency: z.string().min(1, 'Seleccione una frecuencia'),
  processId: z.string().min(1, 'Seleccione un proceso'),
  responsibleId: z.string(),
  description: z.string(),
  formula: z.string(),
})

const valueSchema = z.object({
  period: z.string().min(1, 'El período es obligatorio'),
  value: z.string().min(1, 'El valor es obligatorio').refine((v) => !Number.isNaN(Number(v)), 'Debe ser un número'),
})

type KpiFormValues = z.infer<typeof kpiSchema>
type ValueFormValues = z.infer<typeof valueSchema>

function toPayload(values: KpiFormValues) {
  return {
    ...values,
    target: Number(values.target),
  }
}

function toFormValues(item: Kpi): KpiFormValues {
  return {
    name: item.name,
    unit: item.unit,
    target: String(item.target),
    frequency: item.frequency,
    processId: item.processId,
    responsibleId: item.responsibleId ?? '',
    description: item.description ?? '',
    formula: item.formula ?? '',
  }
}

function KpiValuesDialog({ kpi, open, onClose }: { kpi: Kpi | null; open: boolean; onClose: () => void }) {
  const [addOpen, setAddOpen] = useState(false)
  const [deleting, setDeleting] = useState<KpiValue | null>(null)
  const valuesQuery = useKpiValues(kpi?.id ?? null)
  const createValue = useCreateKpiValue(kpi?.id ?? '')
  const deleteValue = useDeleteKpiValue(kpi?.id ?? '')

  const valueForm = useForm<ValueFormValues>({
    resolver: zodResolver(valueSchema),
    defaultValues: { period: '', value: '' },
  })

  function onAddValue(values: ValueFormValues) {
    createValue.mutate({ period: values.period, value: Number(values.value) }, {
      onSuccess: () => { setAddOpen(false); valueForm.reset(); toast.success('Valor registrado') },
      onError: (e: Error) => toast.error(e.message),
    })
  }

  function onDeleteValue() {
    if (!deleting) return
    deleteValue.mutate(deleting.id, {
      onSuccess: () => { setDeleting(null); toast.success('Valor eliminado') },
      onError: (e: Error) => toast.error(e.message),
    })
  }

  const valueColumns: Column<KpiValue>[] = [
    { header: 'Período', cell: (v) => <span className="font-medium">{v.period}</span> },
    { header: 'Valor', cell: (v) => `${v.value} ${kpi?.unit ?? ''}` },
    { header: 'Fecha', cell: (v) => formatDate(v.date) },
    {
      header: '',
      className: 'w-12 text-right',
      cell: (v) => (
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleting(v)}>
          <Trash2 />
        </Button>
      ),
    },
  ]

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Valores — {kpi?.name}</DialogTitle>
            <DialogDescription>Meta: {kpi?.target} {kpi?.unit} ({kpi && KPI_FREQUENCY_LABELS[kpi.frequency]})</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {valuesQuery.isLoading && <Loading />}
            {valuesQuery.isError && <ErrorState message="Error cargando valores" />}
            {valuesQuery.data && valuesQuery.data.length === 0 && <EmptyState message="Sin valores registrados" />}
            {valuesQuery.data && valuesQuery.data.length > 0 && <DataTable columns={valueColumns} data={valuesQuery.data} keyFn={(v) => v.id} />}
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Registrar valor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar valor</DialogTitle>
            <DialogDescription>Período (ej: 2026-01) y valor para {kpi?.name}</DialogDescription>
          </DialogHeader>
          <Form {...valueForm}>
            <form onSubmit={valueForm.handleSubmit(onAddValue)} className="space-y-4">
              <FormField control={valueForm.control} name="period" render={({ field }) => (
                <FormItem>
                  <FormLabel>Período</FormLabel>
                  <FormControl><Input placeholder="2026-01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={valueForm.control} name="value" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor</FormLabel>
                  <FormControl><Input type="number" step="any" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="submit" disabled={createValue.isPending}>Guardar</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deleting} onOpenChange={() => setDeleting(null)} title="Eliminar valor" description="¿Eliminar este valor de KPI?" onConfirm={onDeleteValue} />
    </>
  )
}

export function KpisPage() {
  const [page, setPage] = useState(1)
  const [valuesKpi, setValuesKpi] = useState<Kpi | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Kpi | null>(null)
  const [deleting, setDeleting] = useState<Kpi | null>(null)

  const query = useList<Kpi>('kpis', { page, limit: 20 })
  const createMutation = useCreate<Kpi>('kpis')
  const updateMutation = useUpdate<Kpi>('kpis')
  const deleteMutation = useDelete('kpis')

  const form = useForm<KpiFormValues>({
    resolver: zodResolver(kpiSchema),
    defaultValues: { name: '', unit: '%', target: '', frequency: 'MONTHLY', processId: '', responsibleId: '', description: '', formula: '' },
  })

  function openCreate() {
    setEditing(null)
    form.reset({ name: '', unit: '%', target: '', frequency: 'MONTHLY', processId: '', responsibleId: '', description: '', formula: '' })
    setDialogOpen(true)
  }

  function openEdit(item: Kpi) {
    setEditing(item)
    form.reset(toFormValues(item))
    setDialogOpen(true)
  }

  function onSubmit(values: KpiFormValues) {
    const payload = toPayload(values)
    const cbs = {
      onSuccess: () => { setDialogOpen(false); toast.success(editing ? 'KPI actualizado' : 'KPI creado') },
      onError: (e: Error) => toast.error(e.message),
    }
    if (editing) updateMutation.mutate({ id: editing.id, ...payload }, cbs)
    else createMutation.mutate(payload, cbs)
  }

  function onDelete() {
    if (!deleting) return
    deleteMutation.mutate(deleting.id, {
      onSuccess: () => { setDeleting(null); toast.success('KPI eliminado') },
      onError: (e: Error) => toast.error(e.message),
    })
  }

  const data = query.data?.data ?? []
  const total = query.data?.total ?? 0

  const columns: Column<Kpi>[] = [
    { header: 'Nombre', cell: (k) => <span className="font-medium">{k.name}</span> },
    { header: 'Meta', cell: (k) => `${k.target} ${k.unit}` },
    { header: 'Frecuencia', cell: (k) => <StatusBadge value={k.frequency} /> },
    { header: 'Proceso', cell: (k) => k.process?.name ?? '—' },
    { header: 'Creado', cell: (k) => formatDate(k.createdAt) },
    {
      header: '',
      className: 'w-32 text-right',
      cell: (k) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" aria-label="Valores" onClick={() => setValuesKpi(k)}>
            <Table />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => openEdit(k)}>
            <Pencil />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Eliminar" className="text-destructive hover:text-destructive" onClick={() => setDeleting(k)}>
            <Trash2 />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Indicadores KPI" description="Indicadores clave de desempeño" action={<Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Nuevo KPI</Button>} />
      {query.isLoading && <Loading />}
      {query.isError && <ErrorState message="Error cargando KPIs" />}
      {data.length === 0 && !query.isLoading && <EmptyState message="No hay KPIs registrados" />}
      {data.length > 0 && <DataTable columns={columns} data={data} keyFn={(k) => k.id} />}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
          <span className="flex items-center text-sm text-muted-foreground">Página {page}</span>
          <Button variant="outline" size="sm" disabled={data.length < 20} onClick={() => setPage((p) => p + 1)}>Siguiente</Button>
        </div>
      )}
      <EntityFormDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? 'Editar KPI' : 'Nuevo KPI'} description="Definir indicador clave de desempeño" fields={fields} form={form as unknown as UseFormReturn<Record<string, string>>} onSubmit={(v) => onSubmit(v as unknown as KpiFormValues)} isSubmitting={createMutation.isPending || updateMutation.isPending} />
      <ConfirmDialog open={!!deleting} onOpenChange={() => setDeleting(null)} title="Eliminar KPI" description="¿Eliminar este KPI y todos sus valores?" onConfirm={onDelete} />
      <KpiValuesDialog kpi={valuesKpi} open={!!valuesKpi} onClose={() => setValuesKpi(null)} />
    </div>
  )
}
