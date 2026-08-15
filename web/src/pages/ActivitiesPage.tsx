import { z } from 'zod'
import { ResourcePage, optionalText, requiredText } from '@/components/ResourcePage'
import type { FieldDef } from '@/components/EntityFormDialog'
import type { Activity } from '@/api/types'
import { formatDate } from '@/lib/utils'

const fields: FieldDef[] = [
  { name: 'title', label: 'Título', type: 'text', required: true },
  { name: 'date', label: 'Fecha', type: 'date', required: true },
  { name: 'processId', label: 'Proceso', type: 'relation', relation: 'processes' },
  { name: 'departmentId', label: 'Departamento', type: 'relation', relation: 'departments' },
  { name: 'description', label: 'Descripción', type: 'textarea' },
]

const schema = z.object({
  title: requiredText('El título es obligatorio'),
  date: requiredText('La fecha es obligatoria'),
  processId: optionalText(),
  departmentId: optionalText(),
  description: optionalText(),
})

export function ActivitiesPage() {
  return (
    <ResourcePage<Activity>
      resource="activities"
      title="Actividades"
      description="Registro de actividades diarias"
      createLabel="Nueva actividad"
      entityLabel="actividad"
      emptyMessage="No hay actividades registradas"
      searchPlaceholder="Buscar por título..."
      fields={fields}
      schema={schema}
      defaultValues={{ title: '', date: new Date().toISOString().slice(0, 10), processId: '', departmentId: '', description: '' }}
      filters={[
        { name: 'processId', label: 'Proceso', type: 'relation', relation: 'processes' },
        { name: 'departmentId', label: 'Departamento', type: 'relation', relation: 'departments' },
        { name: 'from', label: 'Desde', type: 'date' },
        { name: 'to', label: 'Hasta', type: 'date' },
      ]}
      columns={[
        { header: 'Título', cell: (a) => <span className="font-medium">{a.title}</span> },
        { header: 'Fecha', cell: (a) => formatDate(a.date) },
        { header: 'Departamento', cell: (a) => a.department?.name ?? '—' },
        { header: 'Proceso', cell: (a) => a.process?.name ?? '—' },
        { header: 'Usuario', cell: (a) => a.user?.name ?? '—' },
      ]}
    />
  )
}
