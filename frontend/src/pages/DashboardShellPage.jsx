import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Building2,
  ShieldCheck,
  Users,
  Clock,
  Calculator,
  FileText,
  History,
  LogOut,
  CheckCircle2,
  KeyRound,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Executive Overview', icon: Building2, badge: 'Phase 1 Ready', active: true },
  { label: 'Employee 201 Files', icon: Users, badge: 'Phase 2 Next' },
  { label: 'Attendance & DTR', icon: Clock, badge: 'Phase 3' },
  { label: 'Payroll Master Run', icon: Calculator, badge: 'Phase 4' },
  { label: 'My Payslips & Portal', icon: FileText, badge: 'Phase 5' },
]

export default function DashboardShellPage() {
  const { user, logout, hasPermission } = useAuth()
  const [auditLogs, setAuditLogs] = useState([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  useEffect(() => {
    if (hasPermission('audit.view')) {
      setLoadingLogs(true)
      api
        .get('/audit-logs')
        .then(({ data }) => setAuditLogs(data.data || []))
        .catch(() => setAuditLogs([]))
        .finally(() => setLoadingLogs(false))
    }
  }, [user])

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-5 flex items-center gap-3 border-b border-slate-800">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">
              PF
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-none">PayFlow PH</div>
              <div className="text-[11px] text-slate-400 mt-1">HR & Payroll System</div>
            </div>
          </div>

          <div className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium ${
                    item.active
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      item.active
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
          <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
          <div className="mt-2 flex items-center justify-between">
            <Badge variant="default" className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
              {user?.primary_role}
            </Badge>
            <button
              onClick={logout}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Phase 1: Foundation, Authentication & RBAC
            </h1>
            <p className="text-xs text-slate-500">
              Enterprise-Style Philippine HR & Payroll Demonstration System
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="warning">Demonstration System</Badge>
            <Button variant="outline" size="sm" onClick={logout}>
              Switch Demo Role
            </Button>
          </div>
        </header>

        {/* Body */}
        <main className="p-8 space-y-6">
          {/* Active Session & Role Verification */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card>
              <CardHeader>
                <CardDescription>Authenticated Identity</CardDescription>
                <CardTitle className="text-lg mt-1">{user?.name}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 space-y-1">
                <div><strong>Title:</strong> {user?.job_title}</div>
                <div><strong>Department:</strong> {user?.department_name}</div>
                <div><strong>Email:</strong> {user?.email}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Spatie RBAC Role Assignment</CardDescription>
                <CardTitle className="text-lg mt-1 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-600" />
                  {user?.primary_role}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-600">
                <div>
                  <strong>Granted Permissions ({user?.permissions?.length || 0}):</strong>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {user?.permissions?.slice(0, 6).map((perm) => (
                    <Badge key={perm} variant="secondary" className="font-mono text-[10px]">
                      {perm}
                    </Badge>
                  ))}
                  {(user?.permissions?.length || 0) > 6 && (
                    <Badge variant="default" className="text-[10px]">
                      +{user.permissions.length - 6} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardDescription>Stack & Security Status</CardDescription>
                <CardTitle className="text-lg mt-1 flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Sanctum SPA Connected
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 space-y-1">
                <div><strong>Backend:</strong> Laravel 13.40 (PHP 8.3)</div>
                <div><strong>Frontend:</strong> React 19.3 + Vite + Tailwind v4</div>
                <div><strong>Audit Engine:</strong> Spatie Activitylog v4.12</div>
              </CardContent>
            </Card>
          </div>

          {/* Accountable Audit Trail Live Feed */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-4 w-4 text-indigo-600" />
                  Accountable System Audit Trail (Live from Database)
                </CardTitle>
                <CardDescription className="mt-1">
                  Tracks actor identity, event type, IP address, and timestamp for every authentication and state transition.
                </CardDescription>
              </div>
              <Badge variant="purple">spatie/laravel-activitylog</Badge>
            </CardHeader>
            <CardContent>
              {!hasPermission('audit.view') ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 flex items-center gap-2">
                  <KeyRound className="h-4 w-4 shrink-0" />
                  Your current role (<strong>{user?.primary_role}</strong>) does not have the{' '}
                  <code>audit.view</code> permission. Switch to <strong>Super Admin</strong>,{' '}
                  <strong>HR Manager</strong>, or <strong>Approver / Finance</strong> to inspect system audit logs.
                </div>
              ) : loadingLogs ? (
                <div className="text-xs text-slate-500 py-4">Loading audit trail...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">Actor</th>
                        <th className="py-2.5 px-3">Event</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3">IP Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono text-slate-500">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">
                            {log.causer_name}{' '}
                            <span className="text-slate-400 font-normal">({log.causer_email})</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge variant="success">{log.event}</Badge>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">{log.description}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">
                            {log.properties?.ip || '127.0.0.1'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
