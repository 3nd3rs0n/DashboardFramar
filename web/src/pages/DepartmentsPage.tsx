import { z } from 'zod'
import { ResourcePage, requiredText } from '@/components/ResourcePage'
import type { FieldDef } from '@/components/EntityFormDialog'
import type { Department } from '@/api/types'
import { formatDate } from '@/lib/utils'

const fields: FieldDef[] = [
  { name: 'name', label: 'Nombre', type: 'text', required: true },
]

const schema = z.object({
  name: requiredText('El nombre es obligatorio'),
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
      defaultValues={{ name: '' }}
      columns={[
        { header: 'Nombre', cell: (d) => <span className="font-medium">{d.name}</span> },
        { header: 'Creado', cell: (d) => formatDate(d.createdAt) },
      ]}
    />
  )
}
