import { useEffect, useState, type FormEvent } from 'react'
import { Clock3, History, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useCreateProcedureComment, useProcedureComments, useProcedureHistory, useRelationOptions } from '@/api/hooks'
import type { Procedure, ProcedureHistoryEntry } from '@/api/types'
import { ENUM_LABELS } from '@/lib/labels'
import { formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function historyActionLabel(action: ProcedureHistoryEntry['action']): string {
  if (action === 'CREATE') return 'Procedimiento creado'
  if (action === 'DELETE') return 'Procedimiento eliminado'
  return 'Procedimiento actualizado'
}

type HistoryChange = {
  key: string
  label: string
  value: string
  rawValue: string
}

const historyFieldLabels: Record<string, string> = {
  code: 'Código',
  title: 'Título',
  version: 'Versión',
  status: 'Estado',
  dueDate: 'Fecha compromiso',
  departmentId: 'Departamento',
  processName: 'Proceso',
  content: 'Contenido',
}

function shortenIdentifier(value: string): string {
  if (value.length <= 14) return value
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

function formatHistoryValue(key: string, value: unknown, departmentNames: Record<string, string>): string {
  const rawValue = String(value)
  if (key === 'departmentId') return departmentNames[rawValue] ?? `Código ${shortenIdentifier(rawValue)}`
  if (key === 'status') return ENUM_LABELS[rawValue] ?? rawValue
  if (key.endsWith('At') || key.endsWith('Date')) return formatDate(rawValue)
  if (typeof value === 'object') return JSON.stringify(value)
  if (key.endsWith('Id')) return shortenIdentifier(rawValue)
  return rawValue
}

function historyChanges(changes: unknown, departmentNames: Record<string, string>): HistoryChange[] {
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) return []
  return Object.entries(changes as Record<string, unknown>)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([key, value]) => ({
      key,
      label: historyFieldLabels[key] ?? key,
      value: formatHistoryValue(key, value, departmentNames),
      rawValue: String(value),
    }))
}

function CommentItem({ comment }: { comment: { id: string; body: string; createdAt: string; user: { name: string } } }) {
  return (
    <article className="rounded-lg bg-muted/50 p-3">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold">{comment.user.name}</span>
        <time className="text-muted-foreground">{formatDateTime(comment.createdAt)}</time>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm">{comment.body}</p>
    </article>
  )
}

export function ProcedureHistoryDialog({
  procedure,
  open,
  onOpenChange,
}: {
  procedure: Procedure
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const historyQuery = useProcedureHistory(procedure.id, open)
  const commentsQuery = useProcedureComments(procedure.id, open)
  const commentMutation = useCreateProcedureComment(procedure.id)
  const [comment, setComment] = useState('')
  const departmentOptions = useRelationOptions('departments')
  const departmentNames: Record<string, string> = Object.fromEntries(
    departmentOptions.map((option) => [option.value, option.label]),
  )
  const currentDepartment = procedure.process?.department
  if (currentDepartment) departmentNames[currentDepartment.id] = currentDepartment.name

  useEffect(() => {
    if (!open) setComment('')
  }, [open, procedure.id])

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = comment.trim()
    if (!body) return
    commentMutation.mutate(
      { body },
      {
        onSuccess: () => {
          setComment('')
          toast.success('Avance registrado')
        },
        onError: (error: Error) => toast.error(error.message),
      },
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-3 pr-6">
            <History className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span>{procedure.code ?? 'Procedimiento'} · {procedure.title}</span>
          </DialogTitle>
          <DialogDescription>Registro de las actividades y cambios del procedimiento.</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border bg-muted/20 p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Código</p>
              <p className="mt-1 text-sm font-semibold">{procedure.code ?? 'Sin código'}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Departamento</p>
              <p className="mt-1 truncate text-sm font-semibold">{currentDepartment?.name ?? 'Sin departamento'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Versión</p>
              <p className="mt-1 text-sm font-semibold">{procedure.version}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</p>
              <div className="mt-1"><StatusBadge value={procedure.status} /></div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="min-w-0 rounded-xl border bg-card/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Avances y comentarios</h3>
                <p className="text-xs text-muted-foreground">Registra qué se hizo y qué queda pendiente.</p>
              </div>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {commentsQuery.isPending && <p className="text-sm text-muted-foreground">Cargando avances...</p>}
              {commentsQuery.isError && <p className="text-sm text-destructive">No se pudieron cargar los avances.</p>}
              {!commentsQuery.isPending && !commentsQuery.isError && commentsQuery.data?.length === 0 && (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Aún no hay avances registrados.
                </p>
              )}
              {commentsQuery.data?.map((item) => <CommentItem key={item.id} comment={item} />)}
            </div>
            <form onSubmit={submitComment} className="mt-4 space-y-2">
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Describe el avance realizado..."
                maxLength={2000}
                rows={3}
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">{comment.length}/2000</span>
                <Button type="submit" size="sm" disabled={!comment.trim() || commentMutation.isPending}>
                  <MessageCircle />
                  {commentMutation.isPending ? 'Guardando...' : 'Registrar avance'}
                </Button>
              </div>
            </form>
          </section>

          <section className="min-w-0 rounded-xl border bg-card/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Historial de actividades</h3>
              <p className="text-xs text-muted-foreground">Cambios realizados, con usuario y fecha.</p>
            </div>
            <Clock3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
            {historyQuery.isPending && <p className="text-sm text-muted-foreground">Cargando historial...</p>}
            {historyQuery.isError && <p className="text-sm text-destructive">No se pudo cargar el historial.</p>}
            {!historyQuery.isPending && !historyQuery.isError && historyQuery.data?.length === 0 && (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Sin actividad registrada.</p>
            )}
            {historyQuery.data?.map((entry) => {
              const changes = historyChanges(entry.changes, departmentNames)
              return (
                <article key={entry.id} className="relative rounded-lg border bg-background p-3 pl-4 shadow-sm">
                  <span className="absolute -left-[5px] top-4 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{historyActionLabel(entry.action)}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{entry.user?.name ?? 'Usuario'}</p>
                    </div>
                    <time className="shrink-0 text-right text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</time>
                  </div>
                  {changes.length > 0 ? (
                    <dl className="mt-3 space-y-2 border-t pt-3">
                      {changes.map((change) => (
                        <div key={`${entry.id}-${change.key}`} className="grid gap-1 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-start">
                          <dt className="text-xs font-medium text-muted-foreground">{change.label}</dt>
                          <dd className="min-w-0 break-words text-sm font-medium">
                            {change.key === 'status' ? <StatusBadge value={change.rawValue} /> : change.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">Sin detalle adicional</p>
                  )}
                </article>
              )
            })}
          </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
