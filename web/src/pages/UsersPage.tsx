import { z } from 'zod'
import { ResourcePage, enumOptions } from '@/components/ResourcePage'
import { StatusBadge } from '@/components/StatusBadge'
import type { FieldDef } from '@/components/EntityFormDialog'
import { ROLES, type User } from '@/api/types'
import { ROLE_LABELS } from '@/lib/labels'
import { formatDate } from '@/lib/utils'

const roleOptions = enumOptions(ROLES, ROLE_LABELS)

const fields: FieldDef[] = [
  { name: 'email', label: 'Email', type: 'text', required: true },
  { name: 'name', label: 'Nombre', type: 'text', required: true },
  { name: 'password', label: 'Contraseña', type: 'text', required: true, placeholder: 'Mínimo 8 caracteres' },
  { name: 'role', label: 'Rol', type: 'select', options: roleOptions, required: true },
]

const schema = z.object({
  email: z.string().min(1, 'El email es obligatorio').email('Email inválido'),
  name: z.string().min(1, 'El nombre es obligatorio'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: z.string().min(1, 'Seleccione un rol'),
})

export function UsersPage() {
  return (
    <ResourcePage<User>
      resource="auth/users"
      title="Usuarios"
      description="Gestión de usuarios del sistema"
      createLabel="Nuevo usuario"
      entityLabel="usuario"
      emptyMessage="No hay usuarios registrados"
      searchPlaceholder="Buscar por nombre o email..."
      fields={fields}
      schema={schema}
      defaultValues={{ email: '', name: '', password: '', role: 'ANALYST' }}
      columns={[
        { header: 'Nombre', cell: (u) => <span className="font-medium">{u.name}</span> },
        { header: 'Email', cell: (u) => u.email },
        { header: 'Rol', cell: (u) => <StatusBadge value={u.role} /> },
        { header: 'Creado', cell: (u) => formatDate(u.createdAt) },
      ]}
    />
  )
}
