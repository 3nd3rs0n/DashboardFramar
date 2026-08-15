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
import { FINDING_STATUSES, PRIORITIES, type Finding } from '@/api/types'
import { FINDING_STATUS_LABELS, PRIORITY_LABELS } from '@/lib/labels'
import { formatDate } from '@/lib/utils'

const statusOptions = enumOptions(FINDING_STATUSES, FINDING_STATUS_LABELS)
const priorityOptions = enumOptions(PRIORITIES, PRIORITY_LABELS)

const fields: FieldDef[] = [
  { name: 'code', label: 'Código', type: 'text', placeholder: 'H-001' },
  { name: 'title', label: 'Título', type: 'text', required: true },
  { name: 'type', label: 'Tipo', type: 'text', placeholder: 'AUDIT' },
  { name: 'priority', label: 'Prioridad', type: 'select', options: priorityOptions, required: true },
  { name: 'status', label: 'Estado', type: 'select', options: statusOptions, required: true },
  { name: 'processId', label: 'Proceso', type: 'relation', relation: 'processes', required: true },
  { name: 'responsibleId', label: 'Responsable', type: 'text' },
  { name: 'dueDate', label: 'Fecha compromiso', type: 'date' },
  { name: 'description', label: 'Descripción', type: 'textarea' },
  { name: 'cause', label: 'Causa', type: 'textarea' },
  { name: 'evidence', label: 'Evidencia', type: 'text' },
]

const schema = z.object({
  code: optionalText(),
  title: requiredText('El título es obligatorio'),
  type: optionalText(),
  priority: requiredText('Seleccione una prioridad'),
  status: requiredText('Seleccione un estado'),
  processId: requiredText('Seleccione un proceso'),
  responsibleId: optionalText(),
  dueDate: optionalDate(),
  description: optionalText(),
  cause: optionalText(),
  evidence: optionalText(),
})

export function FindingsPage() {
  return (
    <ResourcePage<Finding>
      resource="findings"
      title="Hallazgos"
      description="Hallazgos de auditoría y levantamiento"
      createLabel="Nuevo hallazgo"
      entityLabel="hallazgo"
      emptyMessage="No hay hallazgos registrados"
      searchPlaceholder="Buscar por título o código..."
      fields={fields}
      schema={schema}
      defaultValues={{
        code: '',
        title: '',
        type: 'AUDIT',
        priority: 'MEDIUM',
        status: 'OPEN',
        processId: '',
        responsibleId: '',
        dueDate: '',
        description: '',
        cause: '',
        evidence: '',
      }}
      filters={[
        { name: 'status', label: 'Estado', type: 'select', options: statusOptions },
        { name: 'priority', label: 'Prioridad', type: 'select', options: priorityOptions },
        { name: 'processId', label: 'Proceso', type: 'relation', relation: 'processes' },
        { name: 'from', label: 'Desde', type: 'date' },
        { name: 'to', label: 'Hasta', type: 'date' },
      ]}
      columns={[
        { header: 'Código', cell: (f) => f.code ?? '—' },
        { header: 'Título', cell: (f) => <span className="font-medium">{f.title}</span> },
        { header: 'Proceso', cell: (f) => f.process?.name ?? '—' },
        { header: 'Prioridad', cell: (f) => <StatusBadge value={f.priority} /> },
        { header: 'Estado', cell: (f) => <StatusBadge value={f.status} /> },
        { header: 'Compromiso', cell: (f) => formatDate(f.dueDate) },
      ]}
    />
  )
}
