import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { formatPHP } from '@/lib/utils'
import AppLayout from '@/components/layout/AppLayout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  Search,
  Eye,
  EyeOff,
  ShieldAlert,
  Lock,
  Plus,
  History,
  TrendingUp,
  X,
  Building2,
} from 'lucide-react'

export default function EmployeesPage() {
  const { hasPermission } = useAuth()
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [positions, setPositions] = useState([])
  const [meta, setMeta] = useState({ total: 0, active_count: 0, total_monthly_basic: 0 })
  const [search, setSearch] = useState('')
  const [selectedDept, setSelectedDept] = useState('')
  const [unmask, setUnmask] = useState(false)
  const [loading, setLoading] = useState(true)

  // Selected 201 Profile Drawer
  const [activeEmployee, setActiveEmployee] = useState(null)
  const [activeTab, setActiveTab] = useState('info')
  const [reviseForm, setReviseForm] = useState({ new_salary: '', effective_date: '2026-11-16', reason: '' })
  const [revising, setRevising] = useState(false)

  // New Employee Modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '+63 917 ',
    civil_status: 'Single',
    department_id: '',
    position_id: '',
    employment_type: 'regular',
    hire_date: '2026-11-05',
    pay_type: 'monthly',
    pay_frequency: 'semi_monthly',
    basic_salary: '35000',
    sss_no: '34-8827162-1',
    philhealth_no: '12-991827361-2',
    pagibig_no: '1210-7716-2839',
    tin_no: '419-283-746-000',
  })

  const fetchOrganization = useCallback(async () => {
    try {
      const { data } = await api.get('/organization')
      setDepartments(data.departments || [])
      setPositions(data.positions || [])
    } catch {
      // ignore
    }
  }, [])

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/employees', {
        params: {
          search: search || undefined,
          department_id: selectedDept || undefined,
          unmask: unmask ? 1 : 0,
        },
      })
      setEmployees(data.data || [])
      setMeta(data.meta || { total: 0, active_count: 0, total_monthly_basic: 0 })
    } finally {
      setLoading(false)
    }
  }, [search, selectedDept, unmask])

  useEffect(() => {
    fetchOrganization()
  }, [fetchOrganization])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const openEmployeeDrawer = async (empId) => {
    const { data } = await api.get(`/employees/${empId}`, {
      params: { unmask: unmask ? 1 : 0 },
    })
    setActiveEmployee(data.employee)
    setReviseForm({
      new_salary: String(data.employee.basic_salary),
      effective_date: '2026-11-16',
      reason: '',
    })
    setActiveTab('info')
  }

  const handleSalaryRevision = async (e) => {
    e.preventDefault()
    if (!activeEmployee) return
    setRevising(true)
    try {
      const { data } = await api.post(`/employees/${activeEmployee.id}/revise-salary`, reviseForm)
      setActiveEmployee(data.employee)
      setReviseForm((prev) => ({ ...prev, reason: '' }))
      fetchEmployees()
    } finally {
      setRevising(false)
    }
  }

  const handleCreateEmployee = async (e) => {
    e.preventDefault()
    await api.post('/employees', createForm)
    setShowCreateModal(false)
    fetchEmployees()
  }

  return (
    <AppLayout
      title="Employee Management (201 Files)"
      subtitle="Master directory with encrypted-at-rest government IDs, de minimis allowances, and salary revision history."
      actions={
        hasPermission('employees.manage') && (
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" /> Onboard Employee
          </Button>
        )
      }
    >
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Active Headcount</CardDescription>
            <CardTitle className="text-2xl">{meta.active_count} Employees</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">
            Across {departments.length} active departments
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Monthly Basic Payroll Base</CardDescription>
            <CardTitle className="text-2xl text-indigo-600">
              {formatPHP(meta.total_monthly_basic)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">
            Excludes de minimis & overtime
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Statutory ID Protection</CardDescription>
            <CardTitle className="text-base flex items-center gap-1.5 text-emerald-700 mt-1">
              <Lock className="h-4 w-4 text-emerald-600" />
              AES-256 Encrypted Casts
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">
            SSS, PhilHealth, Pag-IBIG, TIN & Bank
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sensitive Data Visibility</CardDescription>
            <div className="mt-1">
              {hasPermission('employees.view_sensitive') ? (
                <Button
                  variant={unmask ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => setUnmask(!unmask)}
                  className="w-full"
                >
                  {unmask ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" /> Mask Gov IDs
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" /> Unmask Gov IDs
                    </>
                  )}
                </Button>
              ) : (
                <Badge variant="secondary">Masked (Restricted Role)</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="text-xs text-slate-500">
            Requires <code>employees.view_sensitive</code>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Directory Table */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              201 Employee Master Directory
            </CardTitle>
            <CardDescription className="mt-1">
              Click any employee row to inspect 201 profile, allowances, and salary revision history.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, code, email..."
                className="rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-none w-56"
              />
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 focus:bg-white focus:border-indigo-600 focus:outline-none"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} — {d.name}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading 201 employee records...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department & Position</th>
                    <th className="py-3 px-4">Tenure / Type</th>
                    <th className="py-3 px-4">SSS / TIN</th>
                    <th className="py-3 px-4 text-right">Monthly Basic</th>
                    <th className="py-3 px-4 text-right">Allowances</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => (
                    <tr
                      key={emp.id}
                      onClick={() => openEmployeeDrawer(emp.id)}
                      className="hover:bg-indigo-50/40 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-600">
                        {emp.employee_code}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{emp.full_name}</div>
                        <div className="text-[11px] text-slate-500">{emp.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{emp.position?.title}</div>
                        <div className="text-[11px] text-slate-500">
                          {emp.department?.code} • {emp.department?.name}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={emp.employment_type === 'regular' ? 'success' : 'warning'}
                          className="capitalize"
                        >
                          {emp.employment_type}
                        </Badge>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Hired {emp.hire_date}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        <div>SSS: {emp.sss_no}</div>
                        <div>TIN: {emp.tin_no}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        {formatPHP(emp.basic_salary)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatPHP(emp.total_allowances)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button variant="outline" size="sm">
                          201 File
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 201 Profile Drawer / Modal */}
      {activeEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-200 flex items-start justify-between bg-slate-900 text-white">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                      {activeEmployee.employee_code}
                    </span>
                    <Badge variant="success" className="capitalize">
                      {activeEmployee.employment_type}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-bold mt-2">{activeEmployee.full_name}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeEmployee.position?.title} — {activeEmployee.department?.name}
                  </p>
                </div>
                <button
                  onClick={() => setActiveEmployee(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="px-6 border-b border-slate-200 flex gap-6 text-xs font-semibold">
                {[
                  { id: 'info', label: '201 Personal & Statutory IDs' },
                  { id: 'comp', label: 'Compensation & De Minimis' },
                  { id: 'history', label: 'Salary History & Revise' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3.5 border-b-2 transition-colors cursor-pointer ${
                      activeTab === tab.id
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6 space-y-6 text-xs">
                {activeTab === 'info' && (
                  <>
                    <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-indigo-600" />
                        Personal & Employment Details
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-slate-600">
                        <div><strong>Email:</strong> {activeEmployee.email}</div>
                        <div><strong>Phone:</strong> {activeEmployee.phone}</div>
                        <div><strong>Birth Date:</strong> {activeEmployee.birth_date}</div>
                        <div><strong>Civil Status:</strong> {activeEmployee.civil_status}</div>
                        <div><strong>Hire Date:</strong> {activeEmployee.hire_date}</div>
                        <div><strong>Schedule:</strong> {activeEmployee.work_schedule_start} – {activeEmployee.work_schedule_end}</div>
                        <div className="col-span-2"><strong>Address:</strong> {activeEmployee.address}</div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4 text-indigo-600" />
                          Encrypted Statutory & Bank Identifiers
                        </div>
                        <Badge variant="default">Encrypted at Rest</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 font-mono text-slate-700">
                        <div><strong>SSS No:</strong> {activeEmployee.sss_no}</div>
                        <div><strong>PhilHealth:</strong> {activeEmployee.philhealth_no}</div>
                        <div><strong>Pag-IBIG MID:</strong> {activeEmployee.pagibig_no}</div>
                        <div><strong>BIR TIN:</strong> {activeEmployee.tin_no}</div>
                        <div><strong>Bank:</strong> {activeEmployee.bank_name}</div>
                        <div><strong>Account No:</strong> {activeEmployee.bank_account_no}</div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'comp' && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="text-slate-500">Monthly Basic Salary</div>
                      <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
                        {formatPHP(activeEmployee.basic_salary)}
                      </div>
                      <div className="mt-1 text-slate-500">
                        Semi-Monthly Cutoff Base: <strong>{formatPHP(activeEmployee.basic_salary / 2)}</strong>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 p-4 space-y-2.5">
                      <div className="font-semibold text-slate-900">
                        Monthly Non-Taxable De Minimis Allowances
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-600">Rice Subsidy</span>
                        <span className="font-mono font-medium">{formatPHP(activeEmployee.rice_subsidy)}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-600">Uniform / Clothing Allowance</span>
                        <span className="font-mono font-medium">{formatPHP(activeEmployee.clothing_allowance)}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-600">Medical Cash Allowance</span>
                        <span className="font-mono font-medium">{formatPHP(activeEmployee.medical_allowance)}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-600">Laundry Allowance</span>
                        <span className="font-mono font-medium">{formatPHP(activeEmployee.laundry_allowance)}</span>
                      </div>
                      <div className="flex justify-between pt-2 font-semibold text-indigo-600">
                        <span>Total Monthly De Minimis Package</span>
                        <span className="font-mono">{formatPHP(activeEmployee.total_allowances)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-5">
                    {hasPermission('employees.manage') && (
                      <form
                        onSubmit={handleSalaryRevision}
                        className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3"
                      >
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <TrendingUp className="h-4 w-4 text-indigo-600" />
                          Record Effective-Dated Salary Revision
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              New Monthly Basic (PHP)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              value={reviseForm.new_salary}
                              onChange={(e) => setReviseForm({ ...reviseForm, new_salary: e.target.value })}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium text-slate-600 mb-1">
                              Effective Date
                            </label>
                            <input
                              type="date"
                              required
                              value={reviseForm.effective_date}
                              onChange={(e) => setReviseForm({ ...reviseForm, effective_date: e.target.value })}
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Audit Reason / Justification
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Annual Merit Increase / Promotion"
                            value={reviseForm.reason}
                            onChange={(e) => setReviseForm({ ...reviseForm, reason: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs"
                          />
                        </div>
                        <Button type="submit" size="sm" disabled={revising}>
                          {revising ? 'Saving Revision...' : 'Save Salary Revision & Log Audit'}
                        </Button>
                      </form>
                    )}

                    <div className="space-y-2.5">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <History className="h-4 w-4 text-slate-500" />
                        Effective-Dated Compensation Timeline
                      </div>
                      {activeEmployee.salary_histories?.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-slate-200 p-3 flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-slate-800">{item.reason}</div>
                            <div className="text-[11px] text-slate-500">
                              Effective {item.effective_date} • Approved by {item.approver_name}
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <div className="font-bold text-emerald-700">{formatPHP(item.new_salary)}</div>
                            {item.previous_salary > 0 && (
                              <div className="text-[11px] text-slate-400">
                                from {formatPHP(item.previous_salary)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setActiveEmployee(null)}>
                Close 201 Record
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Onboard New Employee Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Onboard New Employee (201 Record)</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateEmployee} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">First Name</label>
                  <input
                    required
                    value={createForm.first_name}
                    onChange={(e) => setCreateForm({ ...createForm, first_name: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Last Name</label>
                  <input
                    required
                    value={createForm.last_name}
                    onChange={(e) => setCreateForm({ ...createForm, last_name: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Monthly Basic Salary</label>
                  <input
                    type="number"
                    required
                    value={createForm.basic_salary}
                    onChange={(e) => setCreateForm({ ...createForm, basic_salary: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Department</label>
                  <select
                    required
                    value={createForm.department_id}
                    onChange={(e) => setCreateForm({ ...createForm, department_id: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-600 mb-1">Position</label>
                  <select
                    required
                    value={createForm.position_id}
                    onChange={(e) => setCreateForm({ ...createForm, position_id: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5"
                  >
                    <option value="">Select Position</option>
                    {positions
                      .filter((p) => !createForm.department_id || String(p.department_id) === String(createForm.department_id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                <Button type="submit">Create 201 Record</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
