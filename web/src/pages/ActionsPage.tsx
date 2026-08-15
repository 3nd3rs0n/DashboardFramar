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
import { ACTION_STATUSES, ACTION_TYPES, type AuditAction } from '@/api/types'
import { ACTION_STATUS_LABELS, ACTION_TYPE_LABELS } from '@/lib/labels'
import { formatDate } from '@/lib/utils'

const statusOptions = enumOptions(ACTION_STATUSES, ACTION_STATUS_LABELS)
const typeOptions = enumOptions(ACTION_TYPES, ACTION_TYPE_LABELS)

const fields: FieldDef[] = [
  { name: 'title', label: 'Título', type: 'text', required: true },
  { name: 'type', label: 'Tipo', type: 'select', options: typeOptions, required: true },
  { name: 'status', label: 'Estado', type: 'select', options: statusOptions, required: true },
  { name: 'responsibleId', label: 'Responsable', type: 'text' },
  { name: 'dueDate', label: 'Fecha compromiso', type: 'date' },
  { name: 'findingId', label: 'Hallazgo', type: 'relation', relation: 'findings' },
  { name: 'nonConformityId', label: 'No conformidad', type: 'relation', relation: 'non-conformities' },
  { name: 'riskId', label: 'Riesgo', type: 'relation', relation: 'risks' },
  { name: 'opportunityId', label: 'Oportunidad', type: 'relation', relation: 'opportunities' },
  { name: 'description', label: 'Descripción', type: 'textarea' },
]

const schema = z.object({
  title: requiredText('El título es obligatorio'),
  type: requiredText('Seleccione un tipo'),
  status: requiredText('Seleccione un estado'),
  responsibleId: optionalText(),
  dueDate: optionalDate(),
  findingId: optionalText(),
  nonConformityId: optionalText(),
  riskId: optionalText(),
  opportunityId: optionalText(),
  description: optionalText(),
})

export function ActionsPage() {
  return (
    <ResourcePage<AuditAction>
      resource="actions"
      title="Acciones"
      description="Acciones correctivas, preventivas y de mejora"
      createLabel="Nueva acción"
      entityLabel="acción"
      emptyMessage="No hay acciones registradas"
      searchPlaceholder="Buscar por título..."
      fields={fields}
      schema={schema}
      defaultValues={{ title: '', type: 'CORRECTIVE', status: 'PENDING', responsibleId: '', dueDate: '', findingId: '', nonConformityId: '', riskId: '', opportunityId: '', description: '' }}
      filters={[
        { name: 'status', label: 'Estado', type: 'select', options: statusOptions },
        { name: 'type', label: 'Tipo', type: 'select', options: typeOptions },
        { name: 'from', label: 'Desde', type: 'date' },
        { name: 'to', label: 'Hasta', type: 'date' },
      ]}
      columns={[
        { header: 'Título', cell: (a) => <span className="font-medium">{a.title}</span> },
        { header: 'Tipo', cell: (a) => <StatusBadge value={a.type} /> },
        { header: 'Estado', cell: (a) => <StatusBadge value={a.status} /> },
        { header: 'Compromiso', cell: (a) => formatDate(a.dueDate) },
      ]}
    />
  )
}
