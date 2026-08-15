import { z } from 'zod'
import { ResourcePage, optionalText, requiredText } from '@/components/ResourcePage'
import type { FieldDef } from '@/components/EntityFormDialog'
import type { Process } from '@/api/types'

const fields: FieldDef[] = [
  { name: 'name', label: 'Nombre', type: 'text', required: true },
  { name: 'departmentId', label: 'Departamento', type: 'relation', relation: 'departments', required: true },
  { name: 'description', label: 'Descripción', type: 'textarea' },
]

const schema = z.object({
  name: requiredText('El nombre es obligatorio'),
  departmentId: requiredText('Seleccione un departamento'),
  description: optionalText(),
})

export function ProcessesPage() {
  return (
    <ResourcePage<Process>
      resource="processes"
      title="Procesos"
      description="Procesos de la organización por departamento"
      createLabel="Nuevo proceso"
      entityLabel="proceso"
      emptyMessage="No hay procesos registrados"
      searchPlaceholder="Buscar por nombre..."
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', departmentId: '', description: '' }}
      filters={[{ name: 'departmentId', label: 'Departamento', type: 'relation', relation: 'departments' }]}
      columns={[
        { header: 'Nombre', cell: (p) => <span className="font-medium">{p.name}</span> },
        { header: 'Departamento', cell: (p) => p.department?.name ?? '—' },
        { header: 'Descripción', cell: (p) => p.description ?? '—' },
      ]}
    />
  )
}
