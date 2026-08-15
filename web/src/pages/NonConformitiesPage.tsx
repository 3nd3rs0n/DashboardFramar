import { z } from 'zod'
import {
  ResourcePage,
  enumOptions,
  optionalText,
  requiredText,
} from '@/components/ResourcePage'
import { StatusBadge } from '@/components/StatusBadge'
import type { FieldDef } from '@/components/EntityFormDialog'
import { NON_CONFORMITY_STATUSES, type NonConformity } from '@/api/types'
import { NON_CONFORMITY_STATUS_LABELS } from '@/lib/labels'
import { formatDate } from '@/lib/utils'

const statusOptions = enumOptions(NON_CONFORMITY_STATUSES, NON_CONFORMITY_STATUS_LABELS)

const fields: FieldDef[] = [
  { name: 'code', label: 'Código', type: 'text', placeholder: 'NC-001' },
  { name: 'title', label: 'Título', type: 'text', required: true },
  { name: 'status', label: 'Estado', type: 'select', options: statusOptions, required: true },
  { name: 'processId', label: 'Proceso', type: 'relation', relation: 'processes', required: true },
  { name: 'responsibleId', label: 'Responsable', type: 'text' },
  { name: 'description', label: 'Descripción', type: 'textarea' },
  { name: 'requirement', label: 'Requisito', type: 'textarea' },
]

const schema = z.object({
  code: optionalText(),
  title: requiredText('El título es obligatorio'),
  status: requiredText('Seleccione un estado'),
  processId: requiredText('Seleccione un proceso'),
  responsibleId: optionalText(),
  description: optionalText(),
  requirement: optionalText(),
})

export function NonConformitiesPage() {
  return (
    <ResourcePage<NonConformity>
      resource="non-conformities"
      title="No Conformidades"
      description="No conformidades detectadas"
      createLabel="Nueva no conformidad"
      entityLabel="no conformidad"
      emptyMessage="No hay no conformidades registradas"
      searchPlaceholder="Buscar por título o código..."
      fields={fields}
      schema={schema}
      defaultValues={{ code: '', title: '', status: 'OPEN', processId: '', responsibleId: '', description: '', requirement: '' }}
      filters={[
        { name: 'status', label: 'Estado', type: 'select', options: statusOptions },
        { name: 'processId', label: 'Proceso', type: 'relation', relation: 'processes' },
      ]}
      columns={[
        { header: 'Código', cell: (nc) => nc.code ?? '—' },
        { header: 'Título', cell: (nc) => <span className="font-medium">{nc.title}</span> },
        { header: 'Proceso', cell: (nc) => nc.process?.name ?? '—' },
        { header: 'Estado', cell: (nc) => <StatusBadge value={nc.status} /> },
        { header: 'Detectada', cell: (nc) => formatDate(nc.detectedAt) },
      ]}
    />
  )
}
