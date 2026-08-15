import { z } from 'zod'
import { ResourcePage, optionalText, requiredText } from '@/components/ResourcePage'
import type { FieldDef } from '@/components/EntityFormDialog'
import type { Department } from '@/api/types'
import { formatDate } from '@/lib/utils'

const fields: FieldDef[] = [
  { name: 'name', label: 'Nombre', type: 'text', required: true },
  { name: 'description', label: 'Descripción', type: 'textarea' },
]

const schema = z.object({
  name: requiredText('El nombre es obligatorio'),
  description: optionalText(),
})

export function DepartmentsPage() {
  return (
    <ResourcePage<Department>
      resource="departments"
      title="Departamentos"
      description="Áreas de la organización"
      createLabel="Nuevo departamento"
      entityLabel="departamento"
      emptyMessage="No hay departamentos registrados"
      searchPlaceholder="Buscar por nombre..."
      fields={fields}
      schema={schema}
      defaultValues={{ name: '', description: '' }}
      columns={[
        { header: 'Nombre', cell: (d) => <span className="font-medium">{d.name}</span> },
        { header: 'Descripción', cell: (d) => d.description ?? '—' },
        { header: 'Creado', cell: (d) => formatDate(d.createdAt) },
      ]}
    />
  )
}
