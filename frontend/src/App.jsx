import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { NAV_ITEMS } from '@/components/layout/AppLayout'
import LoginPage from '@/pages/LoginPage'
import DashboardShellPage from '@/pages/DashboardShellPage'
import EmployeesPage from '@/pages/EmployeesPage'
import OrganizationPage from '@/pages/OrganizationPage'
import AttendanceAndLeavePage from '@/pages/AttendanceAndLeavePage'
import PayrollRunPage from '@/pages/PayrollRunPage'
import EmployeePortalPage from '@/pages/EmployeePortalPage'

// Route guard: requires login AND at least one of the module's permissions.
// If the role lacks access, it is redirected to the first module it CAN see.
function ProtectedRoute({ path, children }) {
  const { user, loading, hasAnyPermission } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading PayFlow PH workspace...
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }

  const module = NAV_ITEMS.find((n) => n.to === path)
  if (module && !hasAnyPermission(module.perms)) {
    const allowed = NAV_ITEMS.filter((n) => hasAnyPermission(n.perms))
    const fallback = allowed.find((n) => n.to === '/portal') || allowed[0]
    return <Navigate to={fallback?.to && fallback.to !== path ? fallback.to : '/login'} replace />
  }
  return children
}

const ROUTES = [
  { path: '/', element: <DashboardShellPage /> },
  { path: '/employees', element: <EmployeesPage /> },
  { path: '/organization', element: <OrganizationPage /> },
  { path: '/attendance', element: <AttendanceAndLeavePage /> },
  { path: '/payroll', element: <PayrollRunPage /> },
  { path: '/portal', element: <EmployeePortalPage /> },
]

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          {ROUTES.map((r) => (
            <Route
              key={r.path}
              path={r.path}
              element={<ProtectedRoute path={r.path}>{r.element}</ProtectedRoute>}
            />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
