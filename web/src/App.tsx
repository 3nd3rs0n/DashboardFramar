import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider, ProtectedRoute, RequireAdmin } from '@/auth/AuthContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { DepartmentsPage } from '@/pages/DepartmentsPage'
import { ProcessesPage } from '@/pages/ProcessesPage'
import { ProceduresPage } from '@/pages/ProceduresPage'
import { FindingsPage } from '@/pages/FindingsPage'
import { NonConformitiesPage } from '@/pages/NonConformitiesPage'
import { RisksPage } from '@/pages/RisksPage'
import { OpportunitiesPage } from '@/pages/OpportunitiesPage'
import { ActionsPage } from '@/pages/ActionsPage'
import { TasksPage } from '@/pages/TasksPage'
import { ActivitiesPage } from '@/pages/ActivitiesPage'
import { KpisPage } from '@/pages/KpisPage'
import { UsersPage } from '@/pages/UsersPage'
import { SettingsPage } from '@/pages/SettingsPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/departments" element={<DepartmentsPage />} />
              <Route path="/processes" element={<ProcessesPage />} />
              <Route path="/procedures" element={<ProceduresPage />} />
              <Route path="/findings" element={<FindingsPage />} />
              <Route path="/non-conformities" element={<NonConformitiesPage />} />
              <Route path="/risks" element={<RisksPage />} />
              <Route path="/opportunities" element={<OpportunitiesPage />} />
              <Route path="/actions" element={<ActionsPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/activities" element={<ActivitiesPage />} />
              <Route path="/kpis" element={<KpisPage />} />
              <Route
                path="/users"
                element={
                  <RequireAdmin>
                    <UsersPage />
                  </RequireAdmin>
                }
              />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
