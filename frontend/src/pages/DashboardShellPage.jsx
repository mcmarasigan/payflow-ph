import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'
import AppLayout from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
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
  RotateCcw,
  Search,
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
  const canManageSettings = hasPermission('settings.manage')

  const [activeTab, setActiveTab] = useState('analytics')
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [resetBanner, setResetBanner] = useState('')
  const [auditSearch, setAuditSearch] = useState('')
  const [auditFilter, setAuditFilter] = useState('all')

  const fetchAnalytics = useCallback(() => {
    setLoading(true)
    api
      .get('/executive/analytics')
      .then((res) => setAnalytics(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const handleResetDemo = async () => {
    setResetting(true)
    setResetBanner('')
    try {
      const res = await api.post('/system/reset-demo')
      setResetBanner(res.data.message)
      fetchAnalytics()
    } finally {
      setResetting(false)
    }
  }

  const kpis = analytics?.kpis || {
    active_headcount: 10,
    monthly_basic_run_rate: 0,
    latest_run_code: 'PR-2026-10B',
    latest_net_disbursement: 0,
    latest_statutory_remittance: 0,
  }

  const filteredLogs = (analytics?.audit_logs || []).filter((log) => {
    const matchesCategory =
      auditFilter === 'all' ||
      (auditFilter === 'payroll' && log.log_name === 'payroll') ||
      (auditFilter === 'time' && ['leaves', 'overtime'].includes(log.log_name)) ||
      (auditFilter === 'payslips' && log.log_name === 'payslips') ||
      (auditFilter === 'system' && ['auth', 'system', 'default'].includes(log.log_name))

    if (!matchesCategory) return false
    if (!auditSearch.trim()) return true
    const q = auditSearch.toLowerCase()
    return (
      log.description?.toLowerCase().includes(q) ||
      log.causer_name?.toLowerCase().includes(q) ||
      log.event?.toLowerCase().includes(q)
    )
  })

  return (
    <AppLayout
      title="Executive Analytics, Statutory Remittance & Security Audit"
      subtitle={`Signed in as ${user?.name} (${user?.primary_role}) • ${user?.department_name}`}
      actions={
        canManageSettings && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetDemo}
            disabled={resetting}
            title="Reset synthetic demonstration data to clean baseline (also runs automatically every midnight)"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            {resetting ? 'Resetting DB...' : 'Reset Demo Data'}
          </Button>
        )
      }
    >
      <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
        {resetBanner && (
          <div className="px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shrink-0">
            <span>{resetBanner}</span>
            <button
              onClick={() => setResetBanner('')}
              className="text-[11px] font-semibold underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

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
        <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'analytics' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Landmark className="h-3.5 w-3.5" />
              Department Cost Chart & Gov&apos;t Remittances
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

          {activeTab === 'audit' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Search event, actor, or IP..."
                  className="h-8 pl-8 pr-3 rounded-lg border border-slate-300 bg-white text-xs"
                />
              </div>
              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium"
              >
                <option value="all">All Categories</option>
                <option value="payroll">Payroll Runs</option>
                <option value="time">Leaves & Overtime</option>
                <option value="payslips">Payslip PDF Downloads</option>
                <option value="system">Auth & System</option>
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: RECHARTS DEPARTMENT BREAKDOWN & STATUTORY REMITTANCE SCHEDULE */}
        {activeTab === 'analytics' && (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
            {/* Recharts Department Cost Distribution (5 cols) */}
            <Card className="lg:col-span-5 flex flex-col min-h-0 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
                <div className="text-xs font-bold text-slate-800">
                  Department Payroll Cost (Monthly vs Cutoff Gross)
                </div>
                <Badge variant="default">Recharts Live</Badge>
              </div>
              <div className="flex-1 min-h-0 p-3 flex flex-col justify-between overflow-y-auto">
                <div className="h-52 w-full shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics?.department_breakdown || []}
                      margin={{ top: 8, right: 12, left: 4, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(val) => fmt(val)}
                        contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar
                        dataKey="monthly_basic_total"
                        name="Monthly Basic"
                        fill="#4f46e5"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="latest_cutoff_gross"
                        name="Cutoff Gross"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-2 divide-y divide-slate-100 text-xs">
                  {(analytics?.department_breakdown || []).map((dept) => (
                    <div key={dept.code} className="py-1.5 flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-indigo-600 mr-1.5">
                          [{dept.code}]
                        </span>
                        <span className="font-medium text-slate-800">{dept.name}</span>
                        <span className="ml-1 text-[10px] text-slate-400">
                          ({dept.headcount} emp)
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-slate-900">
                        {fmt(dept.monthly_basic_total)}/mo
                      </span>
                    </div>
                  ))}
                </div>
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
              <Badge variant="success">{filteredLogs.length} Events Shown</Badge>
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
                  {filteredLogs.map((log) => (
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
