import { z } from 'zod'
import {
  ResourcePage,
  enumOptions,
  optionalText,
  requiredText,
} from '@/components/ResourcePage'
import { StatusBadge } from '@/components/StatusBadge'
import type { FieldDef } from '@/components/EntityFormDialog'
import { PROCEDURE_STATUSES, type Procedure } from '@/api/types'
import { PROCEDURE_STATUS_LABELS } from '@/lib/labels'

const statusOptions = enumOptions(PROCEDURE_STATUSES, PROCEDURE_STATUS_LABELS)

const fields: FieldDef[] = [
  { name: 'code', label: 'Código', type: 'text', placeholder: 'PR-001' },
  { name: 'title', label: 'Título', type: 'text', required: true },
  { name: 'version', label: 'Versión', type: 'text' },
  { name: 'status', label: 'Estado', type: 'select', options: statusOptions, required: true },
  { name: 'processId', label: 'Proceso', type: 'relation', relation: 'processes', required: true },
  { name: 'content', label: 'Contenido', type: 'textarea' },
]

const schema = z.object({
  code: optionalText(),
  title: requiredText('El título es obligatorio'),
  version: optionalText(),
  status: requiredText('Seleccione un estado'),
  processId: requiredText('Seleccione un proceso'),
  content: optionalText(),
})

export function ProceduresPage() {
  return (
    <ResourcePage<Procedure>
      resource="procedures"
      title="Procedimientos"
      description="Información documentada de los procesos"
      createLabel="Nuevo procedimiento"
      entityLabel="procedimiento"
      emptyMessage="No hay procedimientos registrados"
      searchPlaceholder="Buscar por título o código..."
      fields={fields}
      schema={schema}
      defaultValues={{ code: '', title: '', version: '1.0', status: 'DRAFT', processId: '', content: '' }}
      filters={[
        { name: 'status', label: 'Estado', type: 'select', options: statusOptions },
        { name: 'processId', label: 'Proceso', type: 'relation', relation: 'processes' },
      ]}
      columns={[
        { header: 'Código', cell: (p) => p.code ?? '—' },
        { header: 'Título', cell: (p) => <span className="font-medium">{p.title}</span> },
        { header: 'Proceso', cell: (p) => p.process?.name ?? '—' },
        { header: 'Versión', cell: (p) => p.version },
        { header: 'Estado', cell: (p) => <StatusBadge value={p.status} /> },
      ]}
    />
  )
}
