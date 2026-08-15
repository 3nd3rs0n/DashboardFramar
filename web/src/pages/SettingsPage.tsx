import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/PageHeader'
import { useAuth } from '@/auth/AuthContext'
import { ROLE_LABELS } from '@/lib/labels'

export function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      <PageHeader title="Configuración" description="Perfil de usuario" />
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-base">Información del perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <span className="text-muted-foreground">Nombre:</span>{' '}
            <span className="font-medium">{user?.name ?? '—'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Email:</span>{' '}
            <span className="font-medium">{user?.email ?? '—'}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Rol:</span>{' '}
            <span className="font-medium">{user?.role ? ROLE_LABELS[user.role] : '—'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
