import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import AppLayout from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock,
  CalendarCheck2,
  Flame,
  SlidersHorizontal,
  Plus,
  CheckCircle2,
  XCircle,
  Moon,
  AlertCircle,
} from 'lucide-react'

const DAY_TYPE_LABELS = {
  ordinary: { label: 'Ordinary Day (1.0x)', variant: 'default' },
  rest_day: { label: 'Rest Day (1.30x)', variant: 'info' },
  special_non_working: { label: 'Special Non-Working (1.30x)', variant: 'warning' },
  special_rest_day: { label: 'Special + Rest Day (1.50x)', variant: 'warning' },
  regular_holiday: { label: 'Regular Holiday (2.00x)', variant: 'danger' },
  regular_holiday_rest_day: { label: 'Reg Holiday + Rest (2.60x)', variant: 'danger' },
}

export default function AttendanceAndLeavePage() {
  const { hasPermission } = useAuth()
  const canApproveOt = hasPermission('overtime.approve')
  const canApproveLeave = hasPermission('leaves.approve')
  const canManagePolicy = hasPermission('employees.manage')

  const [activeTab, setActiveTab] = useState('dtr')
  const [data, setData] = useState({
    employees: [],
    attendances: [],
    overtime_requests: [],
    leave_requests: [],
    leave_balances: [],
    leave_types: [],
    dole_matrix: [],
    summary: { dtr_count: 0, pending_leaves: 0, pending_overtime: 0, total_late_minutes: 0 },
  })
  const [loading, setLoading] = useState(true)
  const [employeeFilter, setEmployeeFilter] = useState('')

  // Modals
  const [showDtrModal, setShowDtrModal] = useState(false)
  const [showOtModal, setShowOtModal] = useState(false)
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [dtrForm, setDtrForm] = useState({
    employee_id: '',
    work_date: '2026-10-30',
    time_in: '09:00',
    time_out: '18:00',
    remarks: '',
  })

  const [otForm, setOtForm] = useState({
    employee_id: '',
    work_date: '2026-10-30',
    day_type: 'ordinary',
    hours_requested: '2.0',
    night_diff_hours: '0',
    reason: '',
  })

  const [leaveForm, setLeaveForm] = useState({
    employee_id: '',
    leave_type_id: '',
    start_date: '2026-11-16',
    end_date: '2026-11-17',
    reason: '',
  })

  const fetchOverview = useCallback(async () => {
    setLoading(true)
    try {
      const params = employeeFilter ? { employee_id: employeeFilter } : {}
      const res = await api.get('/time-and-leave', { params })
      setData(res.data)
      if (!dtrForm.employee_id && res.data.employees?.length) {
        const firstEmpId = String(res.data.employees[0].id)
        setDtrForm((f) => ({ ...f, employee_id: firstEmpId }))
        setOtForm((f) => ({ ...f, employee_id: firstEmpId }))
        setLeaveForm((f) => ({
          ...f,
          employee_id: firstEmpId,
          leave_type_id: String(res.data.leave_types?.[0]?.id || ''),
        }))
      }
    } finally {
      setLoading(false)
    }
  }, [employeeFilter, dtrForm.employee_id])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  const handleRecordDtr = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')
    try {
      await api.post('/attendances', dtrForm)
      setShowDtrModal(false)
      fetchOverview()
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to record attendance.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFileOvertime = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')
    try {
      await api.post('/overtime-requests', otForm)
      setShowOtModal(false)
      fetchOverview()
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to file overtime request.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReviewOvertime = async (id, status) => {
    const remarks = status === 'approved' ? 'Approved per DOLE multiplier matrix' : 'Declined by reviewer'
    await api.post(`/overtime-requests/${id}/review`, { status, review_remarks: remarks })
    fetchOverview()
  }

  const handleFileLeave = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')
    try {
      await api.post('/leave-requests', leaveForm)
      setShowLeaveModal(false)
      fetchOverview()
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to file leave request.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReviewLeave = async (id, status) => {
    const remarks = status === 'approved' ? 'Leave approved & balance updated' : 'Leave declined'
    await api.post(`/leave-requests/${id}/review`, { status, review_remarks: remarks })
    fetchOverview()
  }

  const handleSavePolicy = async (e) => {
    e.preventDefault()
    if (!editingPolicy) return
    setSubmitting(true)
    setErrorMsg('')
    try {
      await api.put(`/leave-types/${editingPolicy.id}`, {
        default_annual_days: Number(editingPolicy.default_annual_days),
        min_tenure_months: Number(editingPolicy.min_tenure_months),
        carry_over_cap: Number(editingPolicy.carry_over_cap),
        is_paid: Boolean(editingPolicy.is_paid),
        is_convertible_to_cash: Boolean(editingPolicy.is_convertible_to_cash),
      })
      setEditingPolicy(null)
      fetchOverview()
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to update leave policy.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppLayout
      title="Attendance, DOLE Overtime & Leave Management"
      subtitle="Daily Time Records (DTR), DOLE Overtime Multiplier Matrix (1.25x–3.38x + 10% NSD), and Configurable Leave Policies"
      actions={
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => { setErrorMsg(''); setShowDtrModal(true) }}>
            <Clock className="h-3.5 w-3.5 mr-1.5" /> Log DTR / Clock
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setErrorMsg(''); setShowOtModal(true) }}>
            <Flame className="h-3.5 w-3.5 mr-1.5" /> File Overtime
          </Button>
          <Button size="sm" onClick={() => { setErrorMsg(''); setShowLeaveModal(true) }}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> File Leave
          </Button>
        </div>
      }
    >
      <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
        {/* Top Summary + Filter + Tab Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
            <button
              onClick={() => setActiveTab('dtr')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'dtr' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              DTR Logs ({data.attendances.length})
            </button>
            <button
              onClick={() => setActiveTab('overtime')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'overtime' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Flame className="h-3.5 w-3.5" />
              DOLE Overtime ({data.overtime_requests.length})
              {data.summary.pending_overtime > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white">
                  {data.summary.pending_overtime}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('leaves')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'leaves' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <CalendarCheck2 className="h-3.5 w-3.5" />
              Leaves & Balances ({data.leave_requests.length})
              {data.summary.pending_leaves > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white">
                  {data.summary.pending_leaves}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'policies' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Leave Policies vs SIL ({data.leave_types.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden xl:flex items-center gap-2 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              <span>Total Late: <strong className="text-rose-600">{data.summary.total_late_minutes} mins</strong></span>
              <span className="text-slate-300">|</span>
              <span>Night Diff Rate: <strong className="text-indigo-600">+10% (22:00–06:00)</strong></span>
            </div>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700"
            >
              <option value="">All Employees (10)</option>
              {data.employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.employee_code} — {emp.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TAB 1: DAILY TIME RECORDS (DTR) */}
        {activeTab === 'dtr' && (
          <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
              <div className="text-xs font-bold text-slate-800">
                Daily Time Record (DTR) Logs — Automatic Late, Undertime, Holiday & Night Shift Differential Computation
              </div>
              <Badge variant="info">Standard Shift: 09:00 – 18:00 (1h Break)</Badge>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Employee</th>
                    <th className="py-2.5 px-3">Work Date</th>
                    <th className="py-2.5 px-3">DOLE Day Classification</th>
                    <th className="py-2.5 px-3">Time In / Out</th>
                    <th className="py-2.5 px-3 text-right">Worked Hrs</th>
                    <th className="py-2.5 px-3 text-right">Late / UT</th>
                    <th className="py-2.5 px-3 text-right">Night Diff (NSD)</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-4">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Loading DTR logs...
                      </td>
                    </tr>
                  ) : data.attendances.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No DTR logs found.
                      </td>
                    </tr>
                  ) : (
                    data.attendances.map((row) => {
                      const dayMeta = DAY_TYPE_LABELS[row.day_type] || { label: row.day_type, variant: 'default' }
                      return (
                        <tr key={row.id} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-4">
                            <div className="font-semibold text-slate-900">{row.employee_name}</div>
                            <div className="text-[11px] font-mono text-slate-500">{row.employee_code}</div>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-800">{row.work_date}</td>
                          <td className="py-2.5 px-3">
                            <Badge variant={dayMeta.variant}>{dayMeta.label}</Badge>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-800">
                            {row.time_in} → {row.time_out}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                            {row.worked_hours.toFixed(2)}h
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {row.late_minutes > 0 ? (
                              <span className="text-rose-600 font-semibold">{row.late_minutes}m late</span>
                            ) : (
                              <span className="text-slate-400">0m</span>
                            )}
                            {row.undertime_minutes > 0 && (
                              <span className="ml-1.5 text-amber-600 font-semibold">
                                / {row.undertime_minutes}m UT
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {row.night_diff_hours > 0 ? (
                              <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold">
                                <Moon className="h-3 w-3" /> {row.night_diff_hours.toFixed(2)}h
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge variant={row.status === 'late' ? 'warning' : 'success'}>
                              {row.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 truncate max-w-xs">{row.remarks || '—'}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB 2: DOLE OVERTIME MATRIX & REQUESTS */}
        {activeTab === 'overtime' && (
          <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
            {/* Compact DOLE Multiplier Matrix Bar */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 shrink-0">
              {data.dole_matrix.map((m) => (
                <div
                  key={m.day_type}
                  className="bg-white rounded-lg border border-slate-200 px-3 py-2 shadow-2xs"
                >
                  <div className="text-[10px] font-semibold uppercase text-slate-500 truncate">{m.label}</div>
                  <div className="mt-0.5 flex items-baseline justify-between">
                    <span className="text-sm font-extrabold font-mono text-indigo-600">
                      {m.multiplier.toFixed(2)}x
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{m.percentage}</span>
                  </div>
                </div>
              ))}
            </div>

            <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
                <div className="text-xs font-bold text-slate-800">
                  Overtime Requests & DOLE Statutory Computation
                </div>
                <span className="text-[11px] text-slate-500">
                  Hourly Rate = (Monthly Basic × 12 ÷ 261 days) ÷ 8 hours
                </span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Employee</th>
                      <th className="py-2.5 px-3">Date & Day Type</th>
                      <th className="py-2.5 px-3 text-right">DOLE Rate</th>
                      <th className="py-2.5 px-3 text-right">OT Hours</th>
                      <th className="py-2.5 px-3 text-right">NSD (+10%)</th>
                      <th className="py-2.5 px-3 text-right">Hourly Base</th>
                      <th className="py-2.5 px-3 text-right">Est. OT Pay</th>
                      <th className="py-2.5 px-3">Reason</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs bg-white">
                    {data.overtime_requests.map((ot) => (
                      <tr key={ot.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-slate-900">
                            {ot.employee?.first_name} {ot.employee?.last_name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {ot.employee?.employee_code}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-mono text-slate-800">{ot.work_date}</div>
                          <div className="text-[11px] text-slate-500">{ot.day_type}</div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-600">
                          {ot.dole_multiplier.toFixed(2)}x
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                          {ot.hours_requested.toFixed(2)}h
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {ot.night_diff_hours > 0 ? `${ot.night_diff_hours.toFixed(2)}h` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          ₱{ot.hourly_rate.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          ₱{ot.estimated_pay.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={ot.reason}>
                          {ot.reason}
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            variant={
                              ot.status === 'approved'
                                ? 'success'
                                : ot.status === 'rejected'
                                  ? 'danger'
                                  : 'warning'
                            }
                          >
                            {ot.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {ot.status === 'pending' && canApproveOt ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleReviewOvertime(ot.id, 'approved')}
                                className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 cursor-pointer"
                                title="Approve Overtime"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleReviewOvertime(ot.id, 'rejected')}
                                className="p-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                                title="Reject Overtime"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              {ot.reviewer_name || 'Locked'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 3: LEAVE REQUESTS & BALANCES */}
        {activeTab === 'leaves' && (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
            {/* Leave Requests Table (7 cols) */}
            <Card className="lg:col-span-7 flex flex-col min-h-0 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
                <div className="text-xs font-bold text-slate-800">
                  Leave Applications (Paid & Unpaid LWOP)
                </div>
                <Badge variant="info">LWOP deducts from semi-monthly cutoff</Badge>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Employee</th>
                      <th className="py-2.5 px-3">Leave Type</th>
                      <th className="py-2.5 px-3">Dates & Days</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs bg-white">
                    {data.leave_requests.map((lr) => (
                      <tr key={lr.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{lr.employee_name}</div>
                          <div className="text-[11px] font-mono text-slate-500">{lr.employee_code}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-800">{lr.leave_code}</span>
                            <Badge variant={lr.is_paid ? 'success' : 'danger'}>
                              {lr.is_paid ? 'PAID' : 'LWOP'}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-44" title={lr.reason}>
                            {lr.reason}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-mono text-slate-800">
                            {lr.start_date} → {lr.end_date}
                          </div>
                          <div className="text-[11px] font-semibold text-indigo-600">
                            {lr.total_days.toFixed(1)} day(s)
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            variant={
                              lr.status === 'approved'
                                ? 'success'
                                : lr.status === 'rejected'
                                  ? 'danger'
                                  : 'warning'
                            }
                          >
                            {lr.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {lr.status === 'pending' && canApproveLeave ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleReviewLeave(lr.id, 'approved')}
                                className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 cursor-pointer"
                                title="Approve Leave"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleReviewLeave(lr.id, 'rejected')}
                                className="p-1 rounded bg-rose-50 text-rose-600 hover:bg-rose-100 cursor-pointer"
                                title="Reject Leave"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              {lr.reviewer_name || 'Locked'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Leave Balances Ledger (5 cols) */}
            <Card className="lg:col-span-5 flex flex-col min-h-0 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
                <div className="text-xs font-bold text-slate-800">2026 Leave Credits Ledger</div>
                <Badge variant="default">SIL / VL / SL</Badge>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                    <tr>
                      <th className="py-2 px-3">Employee</th>
                      <th className="py-2 px-2">Type</th>
                      <th className="py-2 px-2 text-right">Entitled</th>
                      <th className="py-2 px-2 text-right">Used</th>
                      <th className="py-2 px-2 text-right">Pending</th>
                      <th className="py-2 px-3 text-right">Available</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs bg-white">
                    {data.leave_balances.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3">
                          <div className="font-medium text-slate-900 truncate max-w-36">
                            {b.employee_name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">{b.employee_code}</div>
                        </td>
                        <td className="py-2 px-2">
                          <span className="font-mono font-bold text-slate-700">{b.leave_code}</span>
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-slate-600">
                          {b.entitled_days.toFixed(1)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-slate-600">
                          {b.used_days.toFixed(1)}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-amber-600">
                          {b.pending_days > 0 ? b.pending_days.toFixed(1) : '0.0'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                          {b.remaining_days.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 4: CONFIGURABLE LEAVE POLICIES VS STATUTORY SIL */}
        {activeTab === 'policies' && (
          <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  Philippine Statutory Leaves (Labor Code Art. 95) vs Configurable Company Leave Policies
                </div>
                <div className="text-[11px] text-slate-500">
                  Statutory SIL mandates 5 paid days after 12 months tenure; VL/SL are configurable company-granted policies.
                </div>
              </div>
              <Badge variant="info">HR Policy Engine</Badge>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Code & Policy Name</th>
                    <th className="py-2.5 px-3">Legal Classification</th>
                    <th className="py-2.5 px-3 text-right">Annual Days</th>
                    <th className="py-2.5 px-3 text-right">Min Tenure</th>
                    <th className="py-2.5 px-3 text-right">Carry-Over Cap</th>
                    <th className="py-2.5 px-3">Pay & Cash Conversion</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4 text-right">Configure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs bg-white">
                  {data.leave_types.map((lt) => (
                    <tr key={lt.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-indigo-700">{lt.code}</div>
                        <div className="font-semibold text-slate-900">{lt.name}</div>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={lt.category === 'statutory' ? 'warning' : 'info'}>
                          {lt.category === 'statutory' ? 'PH STATUTORY LAW' : 'COMPANY POLICY'}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {Number(lt.default_annual_days).toFixed(1)} days
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {lt.min_tenure_months} mos
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {Number(lt.carry_over_cap).toFixed(1)} days
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <Badge variant={lt.is_paid ? 'success' : 'danger'}>
                            {lt.is_paid ? 'Paid' : 'Unpaid (LWOP)'}
                          </Badge>
                          {lt.is_convertible_to_cash && (
                            <Badge variant="default">Cash Convertible</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-sm">{lt.description}</td>
                      <td className="py-3 px-4 text-right">
                        {canManagePolicy ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setErrorMsg('')
                              setEditingPolicy({ ...lt })
                            }}
                          >
                            Edit Policy
                          </Button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Read-only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* MODAL 1: LOG DTR / WEB CLOCK */}
      {showDtrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Log Daily Time Record (DTR)</h3>
              <button
                onClick={() => setShowDtrModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleRecordDtr} className="p-5 space-y-3 text-xs">
              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Employee</label>
                <select
                  value={dtrForm.employee_id}
                  onChange={(e) => setDtrForm({ ...dtrForm, employee_id: e.target.value })}
                  className="w-full h-9 rounded-lg border border-slate-300 px-2.5"
                  required
                >
                  {data.employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employee_code} — {emp.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Work Date</label>
                  <input
                    type="date"
                    value={dtrForm.work_date}
                    onChange={(e) => setDtrForm({ ...dtrForm, work_date: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-300 px-2.5 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time In (24h)</label>
                  <input
                    type="time"
                    value={dtrForm.time_in}
                    onChange={(e) => setDtrForm({ ...dtrForm, time_in: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-300 px-2.5 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time Out (24h)</label>
                  <input
                    type="time"
                    value={dtrForm.time_out}
                    onChange={(e) => setDtrForm({ ...dtrForm, time_out: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-300 px-2.5 font-mono"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Shift Remarks</label>
                <input
                  type="text"
                  value={dtrForm.remarks}
                  onChange={(e) => setDtrForm({ ...dtrForm, remarks: e.target.value })}
                  placeholder="e.g., Regular shift / Night deployment"
                  className="w-full h-9 rounded-lg border border-slate-300 px-2.5"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowDtrModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? 'Computing...' : 'Save & Compute DTR'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: FILE DOLE OVERTIME */}
      {showOtModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">File DOLE Overtime Request</h3>
              <button
                onClick={() => setShowOtModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleFileOvertime} className="p-5 space-y-3 text-xs">
              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                  {errorMsg}
                </div>
              )}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Employee</label>
                <select
                  value={otForm.employee_id}
                  onChange={(e) => setOtForm({ ...otForm, employee_id: e.target.value })}
                  className="w-full h-9 rounded-lg border border-slate-300 px-2.5"
                  required
                >
                  {data.employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employee_code} — {emp.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Work Date</label>
                  <input
                    type="date"
                    value={otForm.work_date}
                    onChange={(e) => setOtForm({ ...otForm, work_date: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-300 px-2.5 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">DOLE Day Classification</label>
                  <select
                    value={otForm.day_type}
                    onChange={(e) => setOtForm({ ...otForm, day_type: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-300 px-2"
                  >
                    <option value="ordinary">Ordinary Workday (1.25x)</option>
                    <option value="rest_day">Rest Day (1.69x)</option>
                    <option value="special_non_working">Special Non-Working (1.69x)</option>
                    <option value="special_rest_day">Special + Rest Day (1.95x)</option>
                    <option value="regular_holiday">Regular Holiday (2.60x)</option>
                    <option value="regular_holiday_rest_day">Reg Holiday + Rest (3.38x)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">OT Hours Requested</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="16"
                    value={otForm.hours_requested}
                    onChange={(e) => setOtForm({ ...otForm, hours_requested: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-300 px-2.5 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Night Diff Hours (22:00–06:00)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="8"
                    value={otForm.night_diff_hours}
                    onChange={(e) => setOtForm({ ...otForm, night_diff_hours: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-300 px-2.5 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Overtime</label>
                <input
                  type="text"
                  value={otForm.reason}
                  onChange={(e) => setOtForm({ ...otForm, reason: e.target.value })}
                  placeholder="e.g., Production release deployment"
                  className="w-full h-9 rounded-lg border border-slate-300 px-2.5"
                  required
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowOtModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit OT Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: FILE LEAVE REQUEST */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">File Leave Application</h3>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleFileLeave} className="p-5 space-y-3 text-xs">
              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                  {errorMsg}
                </div>
              )}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Employee</label>
                <select
                  value={leaveForm.employee_id}
                  onChange={(e) => setLeaveForm({ ...leaveForm, employee_id: e.target.value })}
                  className="w-full h-9 rounded-lg border border-slate-300 px-2.5"
                  required
                >
                  {data.employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.employee_code} — {emp.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Leave Type</label>
                <select
                  value={leaveForm.leave_type_id}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leave_type_id: e.target.value })}
                  className="w-full h-9 rounded-lg border border-slate-300 px-2.5"
                  required
                >
                  {data.leave_types.map((lt) => (
                    <option key={lt.id} value={lt.id}>
                      {lt.code} — {lt.name} ({lt.is_paid ? 'Paid' : 'Unpaid LWOP'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={leaveForm.start_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-300 px-2.5 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={leaveForm.end_date}
                    onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-300 px-2.5 font-mono"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason</label>
                <input
                  type="text"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="e.g., Personal / Family vacation or medical recovery"
                  className="w-full h-9 rounded-lg border border-slate-300 px-2.5"
                  required
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowLeaveModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? 'Filing...' : 'Submit Leave Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT CONFIGURABLE LEAVE POLICY */}
      {editingPolicy && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Configure Policy: {editingPolicy.code} — {editingPolicy.name}
              </h3>
              <button
                onClick={() => setEditingPolicy(null)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleSavePolicy} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Annual Days</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingPolicy.default_annual_days}
                    onChange={(e) =>
                      setEditingPolicy({ ...editingPolicy, default_annual_days: e.target.value })
                    }
                    className="w-full h-9 rounded-lg border border-slate-300 px-2.5 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Tenure (Mos)</label>
                  <input
                    type="number"
                    value={editingPolicy.min_tenure_months}
                    onChange={(e) =>
                      setEditingPolicy({ ...editingPolicy, min_tenure_months: e.target.value })
                    }
                    className="w-full h-9 rounded-lg border border-slate-300 px-2.5 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Carry-Over Cap</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingPolicy.carry_over_cap}
                    onChange={(e) =>
                      setEditingPolicy({ ...editingPolicy, carry_over_cap: e.target.value })
                    }
                    className="w-full h-9 rounded-lg border border-slate-300 px-2.5 font-mono"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-5 pt-1">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingPolicy.is_paid)}
                    onChange={(e) => setEditingPolicy({ ...editingPolicy, is_paid: e.target.checked })}
                  />
                  <span className="font-medium text-slate-700">Paid Leave</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingPolicy.is_convertible_to_cash)}
                    onChange={(e) =>
                      setEditingPolicy({ ...editingPolicy, is_convertible_to_cash: e.target.checked })
                    }
                  />
                  <span className="font-medium text-slate-700">Convertible to Cash</span>
                </label>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingPolicy(null)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Policy'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

