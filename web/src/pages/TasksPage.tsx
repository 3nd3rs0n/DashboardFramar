import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Building2,
  CalendarDays,
  CalendarClock,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  History,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  defaultToPayload,
  enumOptions,
  optionalDate,
  optionalText,
  requiredText,
} from '@/components/ResourcePage'
import { EntityFormDialog, type FieldDef } from '@/components/EntityFormDialog'
import { ErrorState } from '@/components/ErrorState'
import { FilterBar } from '@/components/FilterBar'
import { Loading } from '@/components/Loading'
import { PageHeader } from '@/components/PageHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/auth/AuthContext'
import {
  useCreate,
  useCreateTaskComment,
  useDelete,
  useList,
  useRelationOptions,
  useTaskComments,
  useTaskHistory,
  useUpdate,
  type ListParams,
} from '@/api/hooks'
import { PRIORITIES, TASK_STATUSES, type Task, type TaskComment, type TaskHistoryEntry, type TaskStatus } from '@/api/types'
import { ENUM_LABELS, PRIORITY_LABELS, TASK_STATUS_LABELS } from '@/lib/labels'
import { formatDate } from '@/lib/utils'

const statusOptions = enumOptions(TASK_STATUSES, TASK_STATUS_LABELS)
const priorityOptions = enumOptions(PRIORITIES, PRIORITY_LABELS)
const PAGE_SIZE = 20

const fields: FieldDef[] = [
  { name: 'title', label: 'Título', type: 'text', required: true },
  { name: 'status', label: 'Estado', type: 'select', options: statusOptions, required: true },
  { name: 'priority', label: 'Prioridad', type: 'select', options: priorityOptions, required: true },
  { name: 'departmentId', label: 'Departamento', type: 'relation', relation: 'departments', required: true },
  { name: 'responsibleId', label: 'Responsable', type: 'text' },
  { name: 'dueDate', label: 'Fecha compromiso', type: 'date' },
]

const schema: z.ZodType<Record<string, string>, z.ZodTypeDef, Record<string, string>> = z.object({
  title: requiredText('El título es obligatorio'),
  status: requiredText('Seleccione un estado'),
  priority: requiredText('Seleccione una prioridad'),
  departmentId: requiredText('Seleccione un departamento'),
  responsibleId: optionalText(),
  dueDate: optionalDate(),
})

const emptyValues = {
  title: '',
  status: 'PENDING',
  priority: 'MEDIUM',
  departmentId: '',
  responsibleId: '',
  dueDate: '',
}

function toFormValues(task: Task): Record<string, string> {
  return {
    title: task.title,
    status: task.status,
    priority: task.priority,
    departmentId: task.departmentId ?? '',
    responsibleId: task.responsibleId ?? '',
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
  }
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('es-CL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function historyActionLabel(action: TaskHistoryEntry['action']): string {
  if (action === 'CREATE') return 'Tarea creada'
  if (action === 'DELETE') return 'Tarea eliminada'
  return 'Tarea modificada'
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
  responsibleId: 'Responsable',
  dueDate: 'Fecha compromiso',
  completedAt: 'Fecha completado',
}

function shortenIdentifier(value: string): string {
  if (value.length <= 14) return value
  return `${value.slice(0, 6)}...${value.slice(-4)}`
}

function formatHistoryValue(key: string, value: unknown, departmentNames: Record<string, string>): string {
  const rawValue = String(value)
  if (key === 'departmentId') return departmentNames[rawValue] ?? `Código ${shortenIdentifier(rawValue)}`
  if (key === 'status' || key === 'priority') return ENUM_LABELS[rawValue] ?? rawValue
  if (key === 'dueDate' || key === 'completedAt') return formatDate(rawValue)
  if (typeof value === 'object') return JSON.stringify(value)
  if (key.endsWith('Id')) return shortenIdentifier(rawValue)
  return rawValue
}

function historyChanges(changes: unknown, departmentNames: Record<string, string>): HistoryChange[] {
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) return []
  const values = changes as Record<string, unknown>
  return Object.entries(values)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([key, value]) => ({
      key,
      label: historyFieldLabels[key] ?? key,
      value: formatHistoryValue(key, value, departmentNames),
      rawValue: String(value),
    }))
}

function taskStatusClasses(status: TaskStatus): string {
  if (status === 'PENDING') return 'border-amber-200 bg-amber-50/40'
  if (status === 'IN_PROGRESS') return 'border-indigo-200 bg-indigo-50/40'
  if (status === 'DONE') return 'border-emerald-200 bg-emerald-50/40'
  return 'border-zinc-200 bg-zinc-50/60'
}

function taskStatusSelectClasses(status: TaskStatus): string {
  if (status === 'PENDING') return 'border-amber-300 bg-amber-100 text-amber-800'
  if (status === 'IN_PROGRESS') return 'border-indigo-300 bg-indigo-100 text-indigo-800'
  if (status === 'DONE') return 'border-emerald-300 bg-emerald-100 text-emerald-800'
  return 'border-zinc-300 bg-zinc-100 text-zinc-700'
}

function TaskItem({
  task,
  onToggle,
  onStatusChange,
  onEdit,
  onDelete,
  onOpenDetails,
  updating,
  showCommentAlert,
  canMutate,
}: {
  task: Task
  onToggle: (task: Task) => void
  onStatusChange: (task: Task, status: TaskStatus) => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onOpenDetails: (task: Task) => void
  updating: boolean
  showCommentAlert: boolean
  canMutate: boolean
}) {
  const completed = task.status === 'DONE'

  return (
    <div className={`group flex items-start gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary/40 hover:shadow-sm ${taskStatusClasses(task.status)}`}>
      <button
        type="button"
        aria-label={completed ? 'Marcar tarea como pendiente' : 'Marcar tarea como completada'}
        aria-pressed={completed}
         disabled={updating || !canMutate}
        onClick={() => onToggle(task)}
        className="mt-0.5 shrink-0 rounded-full text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
      >
        {completed ? (
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        ) : task.status === 'CANCELLED' ? (
          <XCircle className="h-6 w-6 text-zinc-500" />
        ) : (
          <Circle className={`h-6 w-6 ${task.status === 'IN_PROGRESS' ? 'text-indigo-600' : ''}`} />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <button type="button" className="text-left" onClick={() => onOpenDetails(task)}>
          <h3 className={`font-semibold ${completed ? 'text-muted-foreground line-through' : ''}`}>
            {task.title}
          </h3>
        </button>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {task.department?.name && (
            <span className="inline-flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {task.department.name}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            Creada {formatDate(task.createdAt)}
          </span>
          {task.dueDate && (
            <span className={`inline-flex items-center gap-1 ${!completed && new Date(task.dueDate) < new Date() ? 'font-medium text-destructive' : ''}`}>
              <CalendarClock className="h-3.5 w-3.5" />
              Compromiso {formatDate(task.dueDate)}
            </span>
          )}
          <StatusBadge value={task.priority} />
          <Select
            value={task.status}
             disabled={updating || !canMutate}
            onValueChange={(value) => onStatusChange(task, value as TaskStatus)}
          >
            <SelectTrigger className={`h-8 w-full min-w-36 sm:w-40 ${taskStatusSelectClasses(task.status)}`} aria-label={`Estado de ${task.title}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          aria-label={showCommentAlert ? 'Hay comentarios de colaboradores' : 'Ver historial y comentarios'}
          title={showCommentAlert ? 'Hay comentarios de colaboradores' : 'Ver historial y comentarios'}
          className={showCommentAlert ? 'relative text-amber-600 hover:text-amber-700' : undefined}
          onClick={() => onOpenDetails(task)}
        >
          <MessageCircle />
          {showCommentAlert && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-card" />}
        </Button>
        {canMutate && (
          <>
            <Button variant="ghost" size="icon" aria-label="Editar tarea" onClick={() => onEdit(task)}>
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Eliminar tarea"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(task)}
            >
              <Trash2 />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

function CommentItem({ comment }: { comment: TaskComment }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="font-semibold">{comment.user.name}</span>
        <span className="text-muted-foreground">{formatDateTime(comment.createdAt)}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm">{comment.body}</p>
    </div>
  )
}

function TaskDetailDialog({
  task,
  open,
  onOpenChange,
}: {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const taskId = task?.id ?? null
  const departmentOptions = useRelationOptions('departments')
  const commentsQuery = useTaskComments(taskId)
  const historyQuery = useTaskHistory(taskId)
  const [comment, setComment] = useState('')
  const commentMutation = useCreateTaskComment(task?.id ?? '')
  const departmentNames: Record<string, string> = Object.fromEntries(
    departmentOptions.map((option) => [option.value, option.label]),
  )
  if (task?.department) departmentNames[task.department.id] = task.department.name

  useEffect(() => {
    if (!open) setComment('')
  }, [open, taskId])

  function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = comment.trim()
    if (!body || !task) return
    commentMutation.mutate(
      { body },
      {
        onSuccess: () => {
          setComment('')
          toast.success('Comentario agregado')
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
            <span>{task?.title ?? 'Detalle de tarea'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-xl border bg-muted/20 p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Departamento</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
                <Building2 className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{task?.department?.name ?? 'Sin departamento'}</span>
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Estado</p>
              <div className="mt-1"><StatusBadge value={task?.status} /></div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Prioridad</p>
              <div className="mt-1"><StatusBadge value={task?.priority} /></div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fecha compromiso</p>
              <p className="mt-1 text-sm font-semibold">{task?.dueDate ? formatDate(task.dueDate) : 'Sin fecha'}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <section className="min-w-0 rounded-xl border bg-card/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Sugerencias y comentarios</h3>
              <span className="text-xs text-muted-foreground">Visible para el equipo</span>
            </div>
            <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {commentsQuery.isPending && <p className="text-sm text-muted-foreground">Cargando comentarios...</p>}
              {commentsQuery.isError && <p className="text-sm text-destructive">No se pudieron cargar los comentarios.</p>}
              {!commentsQuery.isPending && !commentsQuery.isError && commentsQuery.data?.length === 0 && (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Aún no hay comentarios. Sé el primero en dejar una sugerencia.
                </p>
              )}
              {commentsQuery.data?.map((item) => <CommentItem key={item.id} comment={item} />)}
            </div>
            <form onSubmit={submitComment} className="mt-4 space-y-2">
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Escribe una sugerencia para el equipo..."
                maxLength={2000}
                rows={3}
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">{comment.length}/2000</span>
                <Button type="submit" size="sm" disabled={!comment.trim() || commentMutation.isPending}>
                  <MessageCircle />
                  {commentMutation.isPending ? 'Enviando...' : 'Comentar'}
                </Button>
              </div>
            </form>
          </section>

          <section className="min-w-0 rounded-xl border bg-card/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Historial de cambios</h3>
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
      </DialogContent>
    </Dialog>
  )
}

export function TasksPage() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)

  const params: ListParams = { page, limit: PAGE_SIZE }
  for (const [key, value] of Object.entries(filters)) {
    if (value) params[key] = value
  }

  const query = useList<Task>('tasks', params)
  const createMutation = useCreate<Task>('tasks')
  const updateMutation = useUpdate<Task>('tasks')
  const deleteMutation = useDelete('tasks')
  const form = useForm<Record<string, string>, unknown, Record<string, string>>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  })

  function openCreate() {
    setEditing(null)
    form.reset(emptyValues)
    setDialogOpen(true)
  }

  function openEdit(task: Task) {
    setEditing(task)
    form.reset(toFormValues(task))
    setDialogOpen(true)
  }

  function submitTask(values: Record<string, string>) {
    const payload = defaultToPayload(fields, values)
    const callbacks = {
      onSuccess: () => {
        setDialogOpen(false)
        toast.success(editing ? 'Tarea actualizada' : 'Tarea creada')
      },
      onError: (error: Error) => toast.error(error.message),
    }
    if (editing) updateMutation.mutate({ id: editing.id, ...payload }, callbacks)
    else createMutation.mutate(payload, callbacks)
  }

  function changeTaskStatus(task: Task, status: TaskStatus) {
    if (task.status === status) return
    setUpdatingTaskId(task.id)
    updateMutation.mutate(
      {
        id: task.id,
        status,
        completedAt: status === 'DONE' ? task.completedAt ?? new Date().toISOString() : null,
      },
      {
        onSuccess: () => toast.success(`Estado cambiado a ${TASK_STATUS_LABELS[status]}`),
        onError: (error: Error) => toast.error(error.message),
        onSettled: () => setUpdatingTaskId(null),
      },
    )
  }

  function toggleTask(task: Task) {
    const nextStatus = task.status === 'DONE' || task.status === 'CANCELLED' ? 'PENDING' : 'DONE'
    changeTaskStatus(task, nextStatus)
  }

  function deleteTask(task: Task) {
    if (!window.confirm(`¿Eliminar la tarea "${task.title}"?`)) return
    deleteMutation.mutate(task.id, {
      onSuccess: () => toast.success('Tarea eliminada'),
      onError: (error: Error) => toast.error(error.message),
    })
  }

  function openDetails(task: Task) {
    setSelectedTask(task)
    setDetailOpen(true)
  }

  const items = query.data?.data ?? []
  const activeTasks = items.filter((task) => task.status !== 'DONE' && task.status !== 'CANCELLED')
  const completedTasks = items.filter((task) => task.status === 'DONE' || task.status === 'CANCELLED')
  const pendingTasks = items.filter((task) => task.status === 'PENDING')
  const inProgressTasks = items.filter((task) => task.status === 'IN_PROGRESS')
  const cancelledTasks = items.filter((task) => task.status === 'CANCELLED')
  const counts = query.data?.counts
  const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / PAGE_SIZE))

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tareas"
        description="Organiza pendientes, comparte sugerencias y conserva cada cambio"
        action={
          <Button onClick={openCreate}>
            <Plus /> Nueva tarea
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-amber-100 p-2 text-amber-700"><Clock3 className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Pendientes</p><p className="text-2xl font-bold">{counts?.pending ?? pendingTasks.length}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-700"><Circle className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">En progreso</p><p className="text-2xl font-bold">{counts?.inProgress ?? inProgressTasks.length}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700"><CheckCircle2 className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Completadas</p><p className="text-2xl font-bold">{counts?.done ?? items.filter((task) => task.status === 'DONE').length}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-zinc-100 p-2 text-zinc-600"><XCircle className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Canceladas</p><p className="text-2xl font-bold">{counts?.cancelled ?? cancelledTasks.length}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700"><MessageCircle className="h-5 w-5" /></div>
            <div><p className="text-xs text-muted-foreground">Colaboración</p><p className="text-sm font-semibold">Historial y comentarios</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-card p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Filtrar tareas</p>
            <p className="text-xs text-muted-foreground">Encuentra pendientes por estado, área o fecha</p>
          </div>
          {Object.values(filters).some(Boolean) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPage(1)
                setFilters({})
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
        <FilterBar
          className="gap-2"
          filters={[
            { name: 'status', label: 'Estado', type: 'select', options: statusOptions },
            { name: 'priority', label: 'Prioridad', type: 'select', options: priorityOptions },
            { name: 'departmentId', label: 'Departamento', type: 'relation', relation: 'departments' },
            { name: 'from', label: 'Creada desde', type: 'date' },
            { name: 'to', label: 'Creada hasta', type: 'date' },
          ]}
          values={filters}
          searchPlaceholder="Buscar por título..."
          onChange={(name, value) => {
            setPage(1)
            setFilters((previous) => ({ ...previous, [name]: value }))
          }}
        />
      </div>

      {query.isPending ? (
        <Loading />
      ) : query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground">
          <Check className="mx-auto mb-3 h-8 w-8" />
          <p>No hay tareas con estos filtros.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTasks.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold"><Circle className="h-4 w-4 text-primary" /> Por hacer</h2>
                <span className="text-sm text-muted-foreground">{activeTasks.length} tareas</span>
              </div>
              {activeTasks.map((task) => (
                <TaskItem key={task.id} task={task} onToggle={toggleTask} onStatusChange={changeTaskStatus} onEdit={openEdit} onDelete={deleteTask} onOpenDetails={openDetails} updating={updatingTaskId === task.id} showCommentAlert={user?.role === 'ADMIN' && Boolean(task.comments?.length)} canMutate={user?.role !== 'VIEWER'} />
              ))}
            </section>
          )}

          {completedTasks.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-muted-foreground"><CheckCircle2 className="h-4 w-4" /> Completadas o canceladas</h2>
              {completedTasks.map((task) => (
                <TaskItem key={task.id} task={task} onToggle={toggleTask} onStatusChange={changeTaskStatus} onEdit={openEdit} onDelete={deleteTask} onOpenDetails={openDetails} updating={updatingTaskId === task.id} showCommentAlert={user?.role === 'ADMIN' && Boolean(task.comments?.length)} canMutate={user?.role !== 'VIEWER'} />
              ))}
            </section>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Anterior</Button>
              <span>Página {page} de {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Siguiente</Button>
            </div>
          )}
        </div>
      )}

      <EntityFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? 'Editar tarea' : 'Nueva tarea'}
        fields={fields}
        form={form}
        onSubmit={submitTask}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
      <TaskDetailDialog task={selectedTask} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  )
}
