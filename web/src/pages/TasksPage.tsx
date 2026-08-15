import { z } from 'zod'
import {
  ResourcePage,
  enumOptions,
  optionalDate,
  optionalText,
  requiredText,
} from '@/components/ResourcePage'
import { StatusBadge } from '@/components/StatusBadge'
import type { FieldDef } from '@/components/EntityFormDialog'
import { PRIORITIES, TASK_STATUSES, type Task } from '@/api/types'
import { PRIORITY_LABELS, TASK_STATUS_LABELS } from '@/lib/labels'
import { formatDate } from '@/lib/utils'

const statusOptions = enumOptions(TASK_STATUSES, TASK_STATUS_LABELS)
const priorityOptions = enumOptions(PRIORITIES, PRIORITY_LABELS)

const fields: FieldDef[] = [
  { name: 'title', label: 'Título', type: 'text', required: true },
  { name: 'status', label: 'Estado', type: 'select', options: statusOptions, required: true },
  { name: 'priority', label: 'Prioridad', type: 'select', options: priorityOptions, required: true },
  { name: 'processId', label: 'Proceso', type: 'relation', relation: 'processes' },
  { name: 'actionId', label: 'Acción', type: 'relation', relation: 'actions' },
  { name: 'responsibleId', label: 'Responsable', type: 'text' },
  { name: 'dueDate', label: 'Fecha compromiso', type: 'date' },
  { name: 'description', label: 'Descripción', type: 'textarea' },
]

const schema = z.object({
  title: requiredText('El título es obligatorio'),
  status: requiredText('Seleccione un estado'),
  priority: requiredText('Seleccione una prioridad'),
  processId: optionalText(),
  actionId: optionalText(),
  responsibleId: optionalText(),
  dueDate: optionalDate(),
  description: optionalText(),
})

export function TasksPage() {
  return (
    <ResourcePage<Task>
      resource="tasks"
      title="Tareas"
      description="Tareas asignadas y seguimiento"
      createLabel="Nueva tarea"
      entityLabel="tarea"
      emptyMessage="No hay tareas registradas"
      searchPlaceholder="Buscar por título..."
      fields={fields}
      schema={schema}
      defaultValues={{ title: '', status: 'PENDING', priority: 'MEDIUM', processId: '', actionId: '', responsibleId: '', dueDate: '', description: '' }}
      filters={[
        { name: 'status', label: 'Estado', type: 'select', options: statusOptions },
        { name: 'priority', label: 'Prioridad', type: 'select', options: priorityOptions },
        { name: 'processId', label: 'Proceso', type: 'relation', relation: 'processes' },
        { name: 'from', label: 'Desde', type: 'date' },
        { name: 'to', label: 'Hasta', type: 'date' },
      ]}
      columns={[
        { header: 'Título', cell: (t) => <span className="font-medium">{t.title}</span> },
        { header: 'Prioridad', cell: (t) => <StatusBadge value={t.priority} /> },
        { header: 'Estado', cell: (t) => <StatusBadge value={t.status} /> },
        { header: 'Proceso', cell: (t) => t.process?.name ?? '—' },
        { header: 'Compromiso', cell: (t) => formatDate(t.dueDate) },
      ]}
    />
  )
}
