import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ShieldCheck,
  History,
  CheckCircle2,
  KeyRound,
} from 'lucide-react'

export default function DashboardShellPage() {
  const { user, hasPermission } = useAuth()
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
    <AppLayout
      title="Executive Overview & Accountable Audit Trail"
      subtitle="Enterprise-Style Philippine HR & Payroll Demonstration System"
    >
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
              Tracks actor identity, event type, IP address, and timestamp for every authentication, 201 update, and salary revision.
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
    </AppLayout>
  )
}
