import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import AppLayout from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ShieldCheck,
  Activity,
  BarChart3,
  Landmark,
  Users,
  Wallet,
  Scale,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

const ALL_PERMISSIONS = [
  'employees.view',
  'employees.manage',
  'employees.view_sensitive',
  'attendance.view',
  'attendance.manage',
  'leaves.view',
  'leaves.approve',
  'overtime.view',
  'overtime.approve',
  'payroll.prepare',
  'payroll.compute',
  'payroll.approve',
  'payroll.release',
  'payslips.view_own',
  'payslips.view_all',
  'settings.manage',
  'audit.view',
]

const fmt = (val) =>
  `₱${Number(val || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

export default function DashboardShellPage() {
  const { user, hasPermission } = useAuth()
  const [activeTab, setActiveTab] = useState('analytics')
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/executive/analytics')
      .then((res) => setAnalytics(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const kpis = analytics?.kpis || {
    active_headcount: 10,
    monthly_basic_run_rate: 0,
    latest_run_code: 'PR-2026-10B',
    latest_net_disbursement: 0,
    latest_statutory_remittance: 0,
  }

  const maxDeptSalary = Math.max(
    1,
    ...(analytics?.department_breakdown || []).map((d) => d.monthly_basic_total)
  )

  return (
    <AppLayout
      title="Executive Analytics, Statutory Remittance & Security Audit"
      subtitle={`Signed in as ${user?.name} (${user?.primary_role}) • ${user?.department_name}`}
    >
      <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-slate-500">Active Employee Headcount</div>
              <div className="text-base font-extrabold text-slate-900 mt-0.5">
                {kpis.active_headcount} Employees
              </div>
            </div>
            <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-slate-500">Monthly Basic Run-Rate</div>
              <div className="text-base font-extrabold font-mono text-slate-900 mt-0.5">
                {fmt(kpis.monthly_basic_run_rate)}
              </div>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="h-4 w-4" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-slate-500">
                Latest Net Pay ({kpis.latest_run_code})
              </div>
              <div className="text-base font-extrabold font-mono text-emerald-700 mt-0.5">
                {fmt(kpis.latest_net_disbursement)}
              </div>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-slate-500">
                Gov&apos;t Remittance (EE+ER+BIR)
              </div>
              <div className="text-base font-extrabold font-mono text-indigo-600 mt-0.5">
                {fmt(kpis.latest_statutory_remittance)}
              </div>
            </div>
            <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Scale className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'analytics' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Landmark className="h-3.5 w-3.5" />
              Department Cost & Gov&apos;t Remittances
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'audit' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              Immutable Audit Trail ({analytics?.audit_logs?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('rbac')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'rbac' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              RBAC & Separation of Duties ({user?.permissions?.length || 0}/{ALL_PERMISSIONS.length})
            </button>
          </div>
        </div>

        {/* TAB 1: DEPARTMENT BREAKDOWN & STATUTORY REMITTANCE SCHEDULE */}
        {activeTab === 'analytics' && (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
            {/* Department Cost Distribution (5 cols) */}
            <Card className="lg:col-span-5 flex flex-col min-h-0 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
                <div className="text-xs font-bold text-slate-800">
                  Department Payroll Cost Distribution
                </div>
                <Badge variant="default">5 Departments</Badge>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                {(analytics?.department_breakdown || []).map((dept) => {
                  const pct = Math.round((dept.monthly_basic_total / maxDeptSalary) * 100)
                  return (
                    <div key={dept.code} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono font-bold text-indigo-600 mr-1.5">
                            [{dept.code}]
                          </span>
                          <span className="font-semibold text-slate-900">{dept.name}</span>
                          <span className="ml-1.5 text-[11px] text-slate-400">
                            ({dept.headcount} emp)
                          </span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">
                          {fmt(dept.monthly_basic_total)}/mo
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-slate-500 flex justify-between font-mono">
                        <span>Latest Cutoff Gross: {fmt(dept.latest_cutoff_gross)}</span>
                        <span>{pct}% of top cost center</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Statutory Remittance Schedule (7 cols) */}
            <Card className="lg:col-span-7 flex flex-col min-h-0 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Government Remittance Schedule (SSS R-3, PhilHealth RF-1, Pag-IBIG MCRF, BIR 1601-C)
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Combined Employee (EE) + Employer (ER + EC) statutory contributions and withholding tax per cutoff
                  </div>
                </div>
                <Badge variant="info">2025/2026 Rates</Badge>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Payroll Run</th>
                      <th className="py-2.5 px-2 text-right">SSS (EE+ER+EC)</th>
                      <th className="py-2.5 px-2 text-right">PhilHealth (5%)</th>
                      <th className="py-2.5 px-2 text-right">Pag-IBIG (EE+ER)</th>
                      <th className="py-2.5 px-2 text-right">BIR 1601-C Tax</th>
                      <th className="py-2.5 px-3 text-right">Total Remittance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          Loading remittance schedule...
                        </td>
                      </tr>
                    ) : (
                      (analytics?.remittance_schedule || []).map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-indigo-700">
                                {r.run_code}
                              </span>
                              <Badge variant={r.status === 'locked' ? 'success' : 'warning'}>
                                {r.status.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate max-w-48">
                              {r.name}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono">
                            <div className="font-semibold text-slate-900">{fmt(r.sss_total)}</div>
                            <div className="text-[10px] text-slate-400">
                              EE {fmt(r.sss_ee)} / ER {fmt(r.sss_er_ec)}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono">
                            <div className="font-semibold text-slate-900">
                              {fmt(r.philhealth_total)}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              EE {fmt(r.philhealth_ee)} / ER {fmt(r.philhealth_er)}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono">
                            <div className="font-semibold text-slate-900">{fmt(r.pagibig_total)}</div>
                            <div className="text-[10px] text-slate-400">
                              EE {fmt(r.pagibig_ee)} / ER {fmt(r.pagibig_er)}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-right font-mono font-semibold text-rose-600">
                            {fmt(r.bir_1601c_tax)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-extrabold text-indigo-700">
                            {fmt(r.grand_total_remittance)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: IMMUTABLE AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
              <div className="text-xs font-bold text-slate-800">
                Spatie Activitylog — Immutable Security & Payroll Compliance Audit Trail
              </div>
              <Badge variant="success">Tamper-Evident Log</Badge>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Event</th>
                    <th className="py-2.5 px-3">Audit Description</th>
                    <th className="py-2.5 px-3">Actor / Role</th>
                    <th className="py-2.5 px-3">Metadata / IP</th>
                    <th className="py-2.5 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs bg-white">
                  {(analytics?.audit_logs || []).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4">
                        <Badge variant="info">{log.event || log.log_name}</Badge>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{log.description}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{log.causer_name}</div>
                        <div className="text-[11px] text-slate-400">{log.causer_email}</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {log.properties?.ip ? `IP: ${log.properties.ip}` : 'Internal System'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[11px] text-slate-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 3: RBAC & SEPARATION OF DUTIES */}
        {activeTab === 'rbac' && (
          <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
              <div className="text-xs font-bold text-slate-800">
                Active Role Permission Matrix — {user?.primary_role}
              </div>
              <Badge variant="info">
                 Payroll Officer computes • Finance Approver locks
              </Badge>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 content-start">
              {ALL_PERMISSIONS.map((perm) => {
                const granted = hasPermission(perm)
                return (
                  <div
                    key={perm}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs ${
                      granted
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    <span className="font-mono font-medium">{perm}</span>
                    {granted ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-slate-300 shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
