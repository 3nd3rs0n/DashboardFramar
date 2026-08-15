import { createContext, useContext, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, useNavigate } from 'react-router-dom'
import { api, getToken, setToken } from '@/api/client'
import type { LoginResponse, User } from '@/api/types'
import { Loading } from '@/components/Loading'

interface AuthContextValue {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken())
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => api<User>('/auth/me'),
    enabled: token !== null,
    retry: false,
    staleTime: 5 * 60_000,
  })

  async function login(email: string, password: string) {
    const res = await api<LoginResponse>('/auth/login', { method: 'POST', body: { email, password } })
    setToken(res.token)
    setTokenState(res.token)
    queryClient.setQueryData(['me'], res.user)
    navigate('/', { replace: true })
  }

  function logout() {
    setToken(null)
    setTokenState(null)
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  return (
    <AuthContext.Provider value={{ user: token ? (meQuery.data ?? null) : null, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!getToken()) return <Navigate to="/login" replace />
  if (!user) return <Loading />
  return <>{children}</>
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />
  return <>{children}</>
}
