import { z } from 'zod'
import {
  ResourcePage,
  enumOptions,
  optionalText,
  requiredText,
} from '@/components/ResourcePage'
import { StatusBadge } from '@/components/StatusBadge'
import type { FieldDef } from '@/components/EntityFormDialog'
import { RISK_STATUSES, type Risk } from '@/api/types'
import { RISK_STATUS_LABELS } from '@/lib/labels'

const statusOptions = enumOptions(RISK_STATUSES, RISK_STATUS_LABELS)

const fields: FieldDef[] = [
  { name: 'title', label: 'Título', type: 'text', required: true },
  { name: 'status', label: 'Estado', type: 'select', options: statusOptions, required: true },
  { name: 'processId', label: 'Proceso', type: 'relation', relation: 'processes', required: true },
  { name: 'responsibleId', label: 'Responsable', type: 'text' },
  { name: 'probability', label: 'Probabilidad (1-5)', type: 'number', required: true },
  { name: 'impact', label: 'Impacto (1-5)', type: 'number', required: true },
  { name: 'description', label: 'Descripción', type: 'textarea' },
  { name: 'mitigation', label: 'Mitigación', type: 'textarea' },
]

const schema = z.object({
  title: requiredText('El título es obligatorio'),
  status: requiredText('Seleccione un estado'),
  processId: requiredText('Seleccione un proceso'),
  responsibleId: optionalText(),
  probability: z.string().min(1, 'Campo obligatorio'),
  impact: z.string().min(1, 'Campo obligatorio'),
  description: optionalText(),
  mitigation: optionalText(),
})

export function RisksPage() {
  return (
    <ResourcePage<Risk>
      resource="risks"
      title="Riesgos"
      description="Identificación y evaluación de riesgos"
      createLabel="Nuevo riesgo"
      entityLabel="riesgo"
      emptyMessage="No hay riesgos registrados"
      searchPlaceholder="Buscar por título..."
      fields={fields}
      schema={schema}
      defaultValues={{ title: '', status: 'IDENTIFIED', processId: '', responsibleId: '', probability: '1', impact: '1', description: '', mitigation: '' }}
      filters={[
        { name: 'status', label: 'Estado', type: 'select', options: statusOptions },
        { name: 'processId', label: 'Proceso', type: 'relation', relation: 'processes' },
      ]}
      columns={[
        { header: 'Título', cell: (r) => <span className="font-medium">{r.title}</span> },
        { header: 'Proceso', cell: (r) => r.process?.name ?? '—' },
        { header: 'Prob.', cell: (r) => r.probability },
        { header: 'Impacto', cell: (r) => r.impact },
        { header: 'Nivel', cell: (r) => <span className="font-semibold">{r.level}</span> },
        { header: 'Estado', cell: (r) => <StatusBadge value={r.status} /> },
      ]}
    />
  )
}
