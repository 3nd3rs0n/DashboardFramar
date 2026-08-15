import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/DataTable'
import { EmptyState } from '@/components/EmptyState'
import { EntityFormDialog, NONE, type FieldDef } from '@/components/EntityFormDialog'
import { ErrorState } from '@/components/ErrorState'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { FilterBar, ALL, type FilterDef } from '@/components/FilterBar'
import { Loading } from '@/components/Loading'
import { PageHeader } from '@/components/PageHeader'
import { useCreate, useDelete, useList, useUpdate } from '@/api/hooks'

// Shared zod helpers: all form values are strings; conversion happens in toPayload.
export const requiredText = (msg = 'Campo obligatorio') => z.string().min(1, msg)
export const optionalText = () => z.string()
export const optionalDate = () => z.string()
export const numberText = () =>
  z
    .string()
    .min(1, 'Campo obligatorio')
    .refine((v) => !Number.isNaN(Number(v)), 'Debe ser un número válido')

export function enumOptions<T extends string>(values: readonly T[], labels: Record<T, string>) {
  return values.map((value) => ({ value, label: labels[value] }))
}

const PAGE_SIZE = 20

export function defaultToPayload(
  fields: FieldDef[],
  values: Record<string, string>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {}
  for (const field of fields) {
    const raw = values[field.name] ?? ''
    if (raw === '' || raw === NONE) continue
    if (field.type === 'number') payload[field.name] = Number(raw)
    else if (field.type === 'date') payload[field.name] = new Date(`${raw}T12:00:00`).toISOString()
    else payload[field.name] = raw
  }
  return payload
}

function defaultToFormValues<T>(fields: FieldDef[], item: T): Record<string, string> {
  const record = item as unknown as Record<string, unknown>
  const values: Record<string, string> = {}
  for (const field of fields) {
    const raw = record[field.name]
    if (raw === null || raw === undefined) {
      values[field.name] = field.type === 'select' || field.type === 'relation' ? NONE : ''
    } else if (field.type === 'date') {
      values[field.name] = String(raw).slice(0, 10)
    } else {
      values[field.name] = String(raw)
    }
  }
  return values
}

export interface ResourcePageConfig<T extends { id: string }> {
  resource: string
  title: string
  description?: string
  createLabel: string
  entityLabel: string
  columns: Column<T>[]
  fields: FieldDef[]
  schema: z.ZodType<Record<string, string>, z.ZodTypeDef, Record<string, string>>
  defaultValues: Record<string, string>
  filters?: FilterDef[]
  searchPlaceholder?: string
  emptyMessage: string
  toFormValues?: (item: T) => Record<string, string>
  toPayload?: (values: Record<string, string>) => Record<string, unknown>
}

export function ResourcePage<T extends { id: string }>(config: ResourcePageConfig<T>) {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<T | null>(null)
  const [deleting, setDeleting] = useState<T | null>(null)

  const params: Record<string, string | number> = { page, limit: PAGE_SIZE }
  for (const [key, value] of Object.entries(filters)) {
    if (value && value !== ALL) params[key] = value
  }

  const query = useList<T>(config.resource, params)
  const createMutation = useCreate<T>(config.resource)
  const updateMutation = useUpdate<T>(config.resource)
  const deleteMutation = useDelete(config.resource)

  const form = useForm<Record<string, string>, unknown, Record<string, string>>({
    resolver: zodResolver(config.schema),
    defaultValues: config.defaultValues,
  })

  const toPayload =
    config.toPayload ?? ((values: Record<string, string>) => defaultToPayload(config.fields, values))

  function openCreate() {
    setEditing(null)
    form.reset(config.defaultValues)
    setDialogOpen(true)
  }

  function openEdit(item: T) {
    setEditing(item)
    form.reset(
      config.toFormValues ? config.toFormValues(item) : defaultToFormValues(config.fields, item)
    )
    setDialogOpen(true)
  }

  function onSubmit(values: Record<string, string>) {
    const payload = toPayload(values)
    const callbacks = {
      onSuccess: () => {
        setDialogOpen(false)
        toast.success(editing ? 'Registro actualizado' : 'Registro creado')
      },
      onError: (error: Error) => toast.error(error.message),
    }
    if (editing) updateMutation.mutate({ id: editing.id, ...payload }, callbacks)
    else createMutation.mutate(payload, callbacks)
  }

  function onDelete() {
    if (!deleting) return
    deleteMutation.mutate(deleting.id, {
      onSuccess: () => {
        setDeleting(null)
        toast.success('Registro eliminado')
      },
      onError: (error: Error) => toast.error(error.message),
    })
  }

  const actionColumn: Column<T> = {
    header: '',
    className: 'w-24 text-right',
    cell: (row) => (
      <div className="flex justify-end gap-1">
        <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => openEdit(row)}>
          <Pencil />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Eliminar"
          className="text-destructive hover:text-destructive"
          onClick={() => setDeleting(row)}
        >
          <Trash2 />
        </Button>
      </div>
    ),
  }

  const items = query.data?.data ?? []
  const total = query.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-4">
      <PageHeader
        title={config.title}
        description={config.description}
        action={
          <Button onClick={openCreate}>
            <Plus /> {config.createLabel}
          </Button>
        }
      />
      <FilterBar
        filters={config.filters ?? []}
        values={filters}
        searchPlaceholder={config.searchPlaceholder}
        onChange={(name, value) => {
          setPage(1)
          setFilters((prev) => ({ ...prev, [name]: value }))
        }}
      />
      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState message={config.emptyMessage} />
      ) : (
        <>
          <DataTable columns={[...config.columns, actionColumn]} data={items} keyFn={(r) => r.id} />
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <span>
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}

      <EntityFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? `Editar ${config.entityLabel}` : config.createLabel}
        fields={config.fields}
        form={form}
        onSubmit={onSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Eliminar ${config.entityLabel}`}
        description="Esta acción no se puede deshacer. ¿Desea continuar?"
        onConfirm={onDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
