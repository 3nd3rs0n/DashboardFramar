import { z } from 'zod'
import {
  ResourcePage,
  enumOptions,
  optionalText,
  requiredText,
} from '@/components/ResourcePage'
import { StatusBadge } from '@/components/StatusBadge'
import type { FieldDef } from '@/components/EntityFormDialog'
import { OPPORTUNITY_STATUSES, type Opportunity } from '@/api/types'
import { OPPORTUNITY_STATUS_LABELS } from '@/lib/labels'

const statusOptions = enumOptions(OPPORTUNITY_STATUSES, OPPORTUNITY_STATUS_LABELS)

const fields: FieldDef[] = [
  { name: 'title', label: 'Título', type: 'text', required: true },
  { name: 'status', label: 'Estado', type: 'select', options: statusOptions, required: true },
  { name: 'processId', label: 'Proceso', type: 'relation', relation: 'processes', required: true },
  { name: 'responsibleId', label: 'Responsable', type: 'text' },
  { name: 'description', label: 'Descripción', type: 'textarea' },
  { name: 'benefit', label: 'Beneficio esperado', type: 'textarea' },
]

const schema = z.object({
  title: requiredText('El título es obligatorio'),
  status: requiredText('Seleccione un estado'),
  processId: requiredText('Seleccione un proceso'),
  responsibleId: optionalText(),
  description: optionalText(),
  benefit: optionalText(),
})

export function OpportunitiesPage() {
  return (
    <ResourcePage<Opportunity>
      resource="opportunities"
      title="Oportunidades"
      description="Oportunidades de mejora detectadas"
      createLabel="Nueva oportunidad"
      entityLabel="oportunidad"
      emptyMessage="No hay oportunidades registradas"
      searchPlaceholder="Buscar por título..."
      fields={fields}
      schema={schema}
      defaultValues={{ title: '', status: 'IDENTIFIED', processId: '', responsibleId: '', description: '', benefit: '' }}
      filters={[
        { name: 'status', label: 'Estado', type: 'select', options: statusOptions },
        { name: 'processId', label: 'Proceso', type: 'relation', relation: 'processes' },
      ]}
      columns={[
        { header: 'Título', cell: (o) => <span className="font-medium">{o.title}</span> },
        { header: 'Proceso', cell: (o) => o.process?.name ?? '—' },
        { header: 'Estado', cell: (o) => <StatusBadge value={o.status} /> },
        { header: 'Beneficio', cell: (o) => o.benefit ?? '—' },
      ]}
    />
  )
}
