import { useEffect, useState, type FormEvent } from 'react'
import { Clock3, History, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  useCreateFindingComment,
  useFindingComments,
  useFindingHistory,
  useFindingParticipants,
  useRelationOptions,
} from '@/api/hooks'
import type { Finding, FindingHistoryEntry } from '@/api/types'
import { ApiError } from '@/api/client'
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

function historyActionLabel(action: FindingHistoryEntry['action']): string {
  if (action === 'CREATE') return 'Hallazgo creado'
  if (action === 'DELETE') return 'Hallazgo eliminado'
  return 'Hallazgo actualizado'
}

type HistoryChange = {
  key: string
  label: string
  value: string
  rawValue: string
}

const historyFieldLabels: Record<string, string> = {
  title: 'Título',
  status: 'Estado',
  priority: 'Prioridad',
  departmentId: 'Departamento',
  dueDate: 'Fecha compromiso',
  closedAt: 'Fecha cierre',
}

function shortenIdentifier(value: string): string {
  if (value.length <= 14) return value
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

function formatHistoryValue(key: string, value: unknown, departmentNames: Record<string, string>): string {
  const rawValue = String(value)
  if (key === 'departmentId') return departmentNames[rawValue] ?? `Código ${shortenIdentifier(rawValue)}`
  if (key === 'status' || key === 'priority') return ENUM_LABELS[rawValue] ?? rawValue
  if (key === 'dueDate' || key === 'closedAt') return formatDate(rawValue)
  if (typeof value === 'object') return JSON.stringify(value)
  if (key.endsWith('Id')) return shortenIdentifier(rawValue)
  return rawValue
}

function historyChanges(changes: unknown, departmentNames: Record<string, string>): HistoryChange[] {
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) return []
  return Object.entries(changes as Record<string, unknown>)
    .filter(([key, value]) => !['processId', 'processName'].includes(key) && value !== null && value !== undefined)
    .map(([key, value]) => ({
      key,
      label: historyFieldLabels[key] ?? key,
      value: formatHistoryValue(key, value, departmentNames),
      rawValue: String(value),
    }))
}

function isForbidden(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403
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

export function FindingCollaborationDialog({
  finding,
  open,
  onOpenChange,
}: {
  finding: Finding | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const findingId = finding?.id ?? null
  const participantsQuery = useFindingParticipants(findingId, open)
  const hasAccess = participantsQuery.data !== undefined && !participantsQuery.isError
  const commentsQuery = useFindingComments(findingId, hasAccess)
  const historyQuery = useFindingHistory(findingId, hasAccess)
  const departmentOptions = useRelationOptions('departments')
  const [comment, setComment] = useState('')
  const commentMutation = useCreateFindingComment(finding?.id ?? '')
  const departmentNames: Record<string, string> = Object.fromEntries(
    departmentOptions.map((option) => [option.value, option.label]),
  )
  const currentDepartment = finding?.process?.department
  if (currentDepartment) departmentNames[currentDepartment.id] = currentDepartment.name

  useEffect(() => {
    if (!open) {
      setComment('')
    }
  }, [findingId, open])

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = comment.trim()
    if (!body || !finding) return
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

  const accessDenied = participantsQuery.isError && isForbidden(participantsQuery.error)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-3 pr-6">
            <History className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span>{finding?.code ?? 'Hallazgo'} · {finding?.title ?? 'Avance y colaboración'}</span>
          </DialogTitle>
          <DialogDescription>
            Registra avances de la solución y conversa con las personas participantes.
          </DialogDescription>
        </DialogHeader>

        {participantsQuery.isPending && (
          <p className="text-sm text-muted-foreground">Comprobando acceso...</p>
        )}
        {accessDenied && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Solo las personas asignadas como participantes pueden consultar el historial y dejar comentarios.
          </div>
        )}
        {participantsQuery.isError && !accessDenied && (
          <p className="text-sm text-destructive">No se pudo cargar la colaboración del hallazgo.</p>
        )}

        {hasAccess && finding && (
          <>
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Código</p>
                  <p className="mt-1 text-sm font-semibold">{finding.code ?? 'Sin código'}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Departamento</p>
                  <p className="mt-1 truncate text-sm font-semibold">{currentDepartment?.name ?? 'Sin departamento'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</p>
                  <div className="mt-1"><StatusBadge value={finding.status} /></div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Prioridad</p>
                  <div className="mt-1"><StatusBadge value={finding.priority} /></div>
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
                    <h3 className="font-semibold">Historial de actividad</h3>
                    <p className="text-xs text-muted-foreground">Cambios realizados en el hallazgo.</p>
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
                                  {change.key === 'status' || change.key === 'priority' ? (
                                    <StatusBadge value={change.rawValue} />
                                  ) : (
                                    change.value
                                  )}
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

          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
