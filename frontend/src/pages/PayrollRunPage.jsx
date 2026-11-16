import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import AppLayout from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calculator,
  CheckCircle2,
  Lock,
  Plus,
  Play,
  Sliders,
  Gift,
  Eye,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'

const fmt = (val) =>
  `₱${Number(val || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

export default function PayrollRunPage() {
  const { hasPermission } = useAuth()
  const canPrepare = hasPermission('payroll.prepare')
  const canCompute = hasPermission('payroll.compute')
  const canApprove = hasPermission('payroll.approve')
  const canRelease = hasPermission('payroll.release')

  const [activeTab, setActiveTab] = useState('register')
  const [runs, setRuns] = useState([])
  const [selectedRun, setSelectedRun] = useState(null)
  const [items, setItems] = useState([])
  const [thirteenthMonth, setThirteenthMonth] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Modals
  const [inspectItem, setInspectItem] = useState(null)
  const [showNewRunModal, setShowNewRunModal] = useState(false)
  const [newRunForm, setNewRunForm] = useState({
    run_code: 'PR-2026-11A',
    name: 'November 2026 — 1st Half Cutoff (Nov 1–15)',
    cutoff_type: 'semi_monthly_1st',
    period_start: '2026-11-01',
    period_end: '2026-11-15',
    pay_date: '2026-11-15',
    remarks: 'Regular November 1st half semi-monthly payroll run',
  })

  // Statutory Simulator state
  const [simSalary, setSimSalary] = useState('58000')
  const [simResult, setSimResult] = useState(null)

  const loadRunDetails = useCallback(async (runId) => {
    const res = await api.get(`/payroll/runs/${runId}`)
    setSelectedRun(res.data.run)
    setItems(res.data.items || [])
  }, [])

  const fetchAll = useCallback(async (keepRunId = null) => {
    setLoading(true)
    try {
      const res = await api.get('/payroll/runs')
      const runList = res.data.runs || []
      setRuns(runList)
      setThirteenthMonth(res.data.thirteenth_month_schedule || [])

      const targetId = keepRunId || runList[0]?.id
      if (targetId) {
        await loadRunDetails(targetId)
      }
    } finally {
      setLoading(false)
    }
  }, [loadRunDetails])

  const runSimulation = useCallback(async (salaryVal) => {
    const res = await api.get('/payroll/simulate', {
      params: { monthly_salary: salaryVal },
    })
    setSimResult(res.data)
  }, [])

  useEffect(() => {
    fetchAll()
    runSimulation(58000)
  }, [fetchAll, runSimulation])

  const handleCreateRun = async (e) => {
    e.preventDefault()
    setProcessing(true)
    setErrorMsg('')
    try {
      const res = await api.post('/payroll/runs', newRunForm)
      setShowNewRunModal(false)
      await fetchAll(res.data.run.id)
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Failed to create payroll run.')
    } finally {
      setProcessing(false)
    }
  }

  const handleAction = async (action) => {
    if (!selectedRun) return
    setProcessing(true)
    setErrorMsg('')
    try {
      const res = await api.post(`/payroll/runs/${selectedRun.id}/${action}`)
      setSelectedRun(res.data.run)
      setItems(res.data.items || [])
      const listRes = await api.get('/payroll/runs')
      setRuns(listRes.data.runs || [])
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || `Action '${action}' failed.`)
    } finally {
      setProcessing(false)
    }
  }

  const statusBadge = (status) => {
    if (status === 'locked') return <Badge variant="success">LOCKED & RELEASED</Badge>
    if (status === 'approved') return <Badge variant="info">APPROVED (IMMUTABLE)</Badge>
    if (status === 'computed') return <Badge variant="warning">COMPUTED (AWAITING APPROVAL)</Badge>
    return <Badge variant="default">DRAFT</Badge>
  }

  return (
    <AppLayout
      title="Philippine Payroll Computation Engine & Master Register"
      subtitle="2025/2026 SSS (₱35k MSC), PhilHealth (5%), Pag-IBIG (1%/2% ₱10k Cap), BIR TRAIN Law Tax & Immutable Workflow"
      actions={
        canPrepare && (
          <Button size="sm" onClick={() => { setErrorMsg(''); setShowNewRunModal(true) }}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> New Payroll Cutoff
          </Button>
        )
      }
    >
      <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
        {/* Top Navigation Tabs & Run Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
            <button
              onClick={() => setActiveTab('register')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'register' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Calculator className="h-3.5 w-3.5" />
              Payroll Master Register ({runs.length} Runs)
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'simulator' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              2025/2026 Statutory Simulator
            </button>
            <button
              onClick={() => setActiveTab('thirteenth')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'thirteenth' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Gift className="h-3.5 w-3.5" />
              13th Month Pay & ₱90k Cap ({thirteenthMonth.length})
            </button>
          </div>

          {activeTab === 'register' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Select Cutoff:</span>
              <select
                value={selectedRun?.id || ''}
                onChange={(e) => loadRunDetails(Number(e.target.value))}
                className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-800"
              >
                {runs.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.run_code} — {r.name} [{r.status.toUpperCase()}]
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: PAYROLL MASTER REGISTER */}
        {activeTab === 'register' && selectedRun && (
          <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
            {/* Workflow Control & KPI Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600">
                      {selectedRun.run_code}
                    </span>
                    <span className="text-sm font-bold text-slate-900">{selectedRun.name}</span>
                    {statusBadge(selectedRun.status)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-3">
                    <span>Period: <strong>{selectedRun.period_start} → {selectedRun.period_end}</strong></span>
                    <span>Pay Date: <strong>{selectedRun.pay_date}</strong></span>
                    {selectedRun.preparer_name && <span>Prepared by: <strong>{selectedRun.preparer_name}</strong></span>}
                    {selectedRun.approver_name && <span>Approved by: <strong>{selectedRun.approver_name}</strong></span>}
                  </div>
                </div>
              </div>

              {/* Separation of Duties Action Buttons */}
              <div className="flex items-center gap-2">
                {!selectedRun.is_immutable && canCompute && (
                  <Button
                    size="sm"
                    variant={selectedRun.status === 'draft' ? 'primary' : 'outline'}
                    onClick={() => handleAction('compute')}
                    disabled={processing}
                  >
                    <Play className="h-3.5 w-3.5 mr-1.5" />
                    {selectedRun.status === 'draft' ? 'Compute Payroll' : 'Recompute Cutoff'}
                  </Button>
                )}

                {selectedRun.status === 'computed' && canApprove && (
                  <Button
                    size="sm"
                    onClick={() => handleAction('approve')}
                    disabled={processing}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    Approve Run (Finance)
                  </Button>
                )}

                {selectedRun.status === 'approved' && canRelease && (
                  <Button
                    size="sm"
                    onClick={() => handleAction('lock')}
                    disabled={processing}
                  >
                    <Lock className="h-3.5 w-3.5 mr-1.5" />
                    Lock & Release Payslips
                  </Button>
                )}

                {selectedRun.is_immutable && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                    <ShieldCheck className="h-4 w-4" />
                    Immutable Snapshot Locked
                  </div>
                )}
              </div>
            </div>

            {/* 4 Compact Financial Totals */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 shrink-0">
              <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5">
                <div className="text-[11px] font-medium text-slate-500">Total Gross Earnings ({selectedRun.headcount} Emp)</div>
                <div className="text-base font-extrabold font-mono text-slate-900 mt-0.5">
                  {fmt(selectedRun.total_gross_pay)}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5">
                <div className="text-[11px] font-medium text-slate-500">Total Deductions (EE + Tax + Late/LWOP)</div>
                <div className="text-base font-extrabold font-mono text-rose-600 mt-0.5">
                  {fmt(selectedRun.total_deductions)}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5">
                <div className="text-[11px] font-medium text-slate-500">Total Net Disbursement</div>
                <div className="text-base font-extrabold font-mono text-emerald-700 mt-0.5">
                  {fmt(selectedRun.total_net_pay)}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 px-4 py-2.5">
                <div className="text-[11px] font-medium text-slate-500">Employer Statutory Share (ER + EC)</div>
                <div className="text-base font-extrabold font-mono text-indigo-600 mt-0.5">
                  {fmt(selectedRun.total_employer_share)}
                </div>
              </div>
            </div>

            {/* Scrollable Payroll Register Table */}
            <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Employee</th>
                      <th className="py-2.5 px-2 text-right">Basic Cutoff</th>
                      <th className="py-2.5 px-2 text-right">OT / NSD / Hol</th>
                      <th className="py-2.5 px-2 text-right">De Minimis</th>
                      <th className="py-2.5 px-2 text-right">Gross Pay</th>
                      <th className="py-2.5 px-2 text-right">Late / LWOP</th>
                      <th className="py-2.5 px-2 text-right">SSS / PH / PI (EE)</th>
                      <th className="py-2.5 px-2 text-right">TRAIN Tax</th>
                      <th className="py-2.5 px-3 text-right">Net Pay</th>
                      <th className="py-2.5 px-3 text-right">Breakdown</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-400">
                          Loading payroll register...
                        </td>
                      </tr>
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-slate-400">
                          No computed items yet. Click &ldquo;Compute Payroll&rdquo; to execute the PH Statutory Engine.
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => {
                        const extras =
                          Number(item.overtime_pay) +
                          Number(item.night_diff_pay) +
                          Number(item.holiday_pay)
                        const attendanceDed =
                          Number(item.late_undertime_deduction) + Number(item.lwop_deduction)
                        const mandatoryEe =
                          Number(item.sss_ee) +
                          Number(item.philhealth_ee) +
                          Number(item.pagibig_ee)

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/80">
                            <td className="py-2 px-3">
                              <div className="font-semibold text-slate-900">{item.employee_name}</div>
                              <div className="text-[10px] font-mono text-slate-500">
                                {item.employee_code} • {item.department_name}
                              </div>
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-slate-800">
                              {fmt(item.basic_pay)}
                            </td>
                            <td className="py-2 px-2 text-right font-mono">
                              {extras > 0 ? (
                                <span className="text-indigo-600 font-semibold">+{fmt(extras)}</span>
                              ) : (
                                <span className="text-slate-400">₱0.00</span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-slate-700">
                              {fmt(item.de_minimis_allowance)}
                            </td>
                            <td className="py-2 px-2 text-right font-mono font-semibold text-slate-900">
                              {fmt(item.gross_pay)}
                            </td>
                            <td className="py-2 px-2 text-right font-mono">
                              {attendanceDed > 0 ? (
                                <span className="text-rose-600 font-semibold">-{fmt(attendanceDed)}</span>
                              ) : (
                                <span className="text-slate-400">₱0.00</span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-slate-700">
                              -{fmt(mandatoryEe)}
                            </td>
                            <td className="py-2 px-2 text-right font-mono text-rose-600">
                              -{fmt(item.withholding_tax)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                              {fmt(item.net_pay)}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setInspectItem(item)}
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" /> Math
                              </Button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: INTERACTIVE 2025/2026 STATUTORY SIMULATOR */}
        {activeTab === 'simulator' && (
          <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto">
            <Card className="p-4 shrink-0">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Interactive 2025/2026 Philippine Statutory & BIR TRAIN Tax Calculator
                  </h3>
                  <p className="text-xs text-slate-500">
                    Test any monthly basic salary to verify SSS (₱35k MSC Cap), PhilHealth (5%), Pag-IBIG (1%/2% Tiered ₱10k Cap), and TRAIN Law Tax.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { label: '₱1,500 (Pag-IBIG 1% Tier)', val: 1500 },
                    { label: '₱20,000 (Tax Exempt)', val: 20000 },
                    { label: '₱58,000 (Full-Stack Eng)', val: 58000 },
                    { label: '₱110,000 (PhilHealth Cap)', val: 110000 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      onClick={() => {
                        setSimSalary(String(p.val))
                        runSimulation(p.val)
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-xs font-medium text-slate-700 cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      value={simSalary}
                      onChange={(e) => setSimSalary(e.target.value)}
                      className="w-32 h-9 rounded-lg border border-slate-300 px-2.5 font-mono text-xs"
                    />
                    <Button size="sm" onClick={() => runSimulation(Number(simSalary))}>
                      Calculate
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {simResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">SSS (2025/2026 Schedule)</span>
                    <Badge variant="info">15% + EC</Badge>
                  </div>
                  <div className="text-xs space-y-1 text-slate-600 font-mono">
                    <div className="flex justify-between"><span>Total MSC:</span><strong>{fmt(simResult.sss.msc)}</strong></div>
                    <div className="flex justify-between"><span>Regular MSC:</span><span>{fmt(simResult.sss.regular_msc)}</span></div>
                    <div className="flex justify-between"><span>MPF / WISP MSC:</span><span>{fmt(simResult.sss.mpf_msc)}</span></div>
                    <div className="border-t border-slate-200 pt-1 flex justify-between text-rose-600 font-bold">
                      <span>Employee Share (5%):</span><span>{fmt(simResult.sss.ee_monthly)}/mo</span>
                    </div>
                    <div className="flex justify-between text-indigo-600">
                      <span>Employer (10% + EC):</span><span>{fmt(simResult.sss.er_monthly + simResult.sss.ec_monthly)}/mo</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">PhilHealth (5% Circular)</span>
                    <Badge variant="info">2.5% / 2.5%</Badge>
                  </div>
                  <div className="text-xs space-y-1 text-slate-600 font-mono">
                    <div className="flex justify-between"><span>Salary Basis:</span><strong>{fmt(simResult.philhealth.salary_basis)}</strong></div>
                    <div className="flex justify-between"><span>Floor / Ceiling:</span><span>₱10k – ₱100k</span></div>
                    <div className="border-t border-slate-200 pt-1 flex justify-between text-rose-600 font-bold">
                      <span>Employee Share (2.5%):</span><span>{fmt(simResult.philhealth.ee_monthly)}/mo</span>
                    </div>
                    <div className="flex justify-between text-indigo-600">
                      <span>Employer Share (2.5%):</span><span>{fmt(simResult.philhealth.er_monthly)}/mo</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Pag-IBIG / HDMF</span>
                    <Badge variant="info">₱10k MFS Cap</Badge>
                  </div>
                  <div className="text-xs space-y-1 text-slate-600 font-mono">
                    <div className="flex justify-between"><span>MFS Basis:</span><strong>{fmt(simResult.pagibig.mfs_basis)}</strong></div>
                    <div className="flex justify-between"><span>Tiered Rate:</span><span>{simResult.pagibig.ee_rate * 100}% EE / 2% ER</span></div>
                    <div className="border-t border-slate-200 pt-1 flex justify-between text-rose-600 font-bold">
                      <span>Employee Share:</span><span>{fmt(simResult.pagibig.ee_monthly)}/mo</span>
                    </div>
                    <div className="flex justify-between text-indigo-600">
                      <span>Employer Share:</span><span>{fmt(simResult.pagibig.er_monthly)}/mo</span>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">BIR TRAIN Law Tax</span>
                    <Badge variant="warning">{simResult.monthly_tax.rate_percent}% Bracket</Badge>
                  </div>
                  <div className="text-xs space-y-1 text-slate-600 font-mono">
                    <div className="flex justify-between"><span>Taxable / Mo:</span><strong>{fmt(simResult.monthly_taxable_income)}</strong></div>
                    <div className="text-[10px] text-slate-500 font-sans">{simResult.monthly_tax.bracket_label}</div>
                    <div className="border-t border-slate-200 pt-1 flex justify-between text-rose-600 font-bold">
                      <span>Monthly Tax:</span><span>{fmt(simResult.monthly_tax.tax)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Semi-Monthly Tax:</span><span>{fmt(simResult.semi_monthly_tax.tax)}</span>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: 13TH MONTH PAY (PD 851) SCHEDULE */}
        {activeTab === 'thirteenth' && (
          <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  2026 Mandatory 13th Month Pay Schedule (Presidential Decree No. 851 & TRAIN Law ₱90,000 Tax Exemption Cap)
                </div>
                <div className="text-[11px] text-slate-500">
                  Formula: Total Basic Salary Earned During Calendar Year ÷ 12. Excess above ₱90,000 is subject to withholding tax.
                </div>
              </div>
              <Badge variant="success">PD 851 Compliant</Badge>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-100 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Employee</th>
                    <th className="py-2.5 px-3">Hire Date</th>
                    <th className="py-2.5 px-3 text-right">Monthly Basic</th>
                    <th className="py-2.5 px-3 text-right">2026 Months Worked</th>
                    <th className="py-2.5 px-3 text-right">Total Basic Earned</th>
                    <th className="py-2.5 px-3 text-right">Gross 13th Month</th>
                    <th className="py-2.5 px-3 text-right">Tax-Exempt (≤ ₱90k)</th>
                    <th className="py-2.5 px-4 text-right">Taxable Excess</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs bg-white">
                  {thirteenthMonth.map((row) => (
                    <tr key={row.employee_id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900">{row.employee_name}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {row.employee_code} • {row.department_name}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{row.hire_date}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                        {fmt(row.monthly_basic_salary)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-indigo-600">
                        {row.months_worked_in_year.toFixed(1)} mos
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                        {fmt(row.total_basic_earned)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        {fmt(row.gross_thirteenth_month)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700">
                        {fmt(row.tax_exempt_portion)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono">
                        {row.taxable_excess_over_90k > 0 ? (
                          <span className="text-rose-600 font-bold">
                            {fmt(row.taxable_excess_over_90k)}
                          </span>
                        ) : (
                          <span className="text-slate-400">₱0.00</span>
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

      {/* MODAL: STEP-BY-STEP COMPUTATION INSPECTOR */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="text-xs font-mono text-indigo-300">{inspectItem.employee_code}</div>
                <h3 className="text-sm font-bold">
                  {inspectItem.employee_name} — {inspectItem.position_title}
                </h3>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="text-xs text-slate-300 hover:text-white cursor-pointer"
              >
                Close [ESC]
              </button>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs max-h-[75vh] overflow-y-auto">
              <div className="space-y-2">
                <div className="font-bold text-slate-900 uppercase border-b pb-1">
                  1. Earnings & DOLE Premiums
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Monthly Basic Reference:</span>
                  <span className="font-mono font-semibold">{fmt(inspectItem.monthly_basic_salary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Daily / Hourly Rate (261 days):</span>
                  <span className="font-mono">{fmt(inspectItem.daily_rate)} / {fmt(inspectItem.hourly_rate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">Semi-Monthly Basic Pay:</span>
                  <span className="font-mono font-semibold">{fmt(inspectItem.basic_pay)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">DOLE Overtime ({inspectItem.overtime_hours}h):</span>
                  <span className="font-mono text-indigo-600">+{fmt(inspectItem.overtime_pay)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">Night Shift Diff ({inspectItem.night_diff_hours}h @ 10%):</span>
                  <span className="font-mono text-indigo-600">+{fmt(inspectItem.night_diff_pay)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">PH Holiday Premium Pay:</span>
                  <span className="font-mono text-indigo-600">+{fmt(inspectItem.holiday_pay)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">Non-Taxable De Minimis:</span>
                  <span className="font-mono text-emerald-700">+{fmt(inspectItem.de_minimis_allowance)}</span>
                </div>
                <div className="flex justify-between border-t pt-1.5 font-bold text-slate-900">
                  <span>GROSS PAY:</span>
                  <span className="font-mono">{fmt(inspectItem.gross_pay)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-900 uppercase border-b pb-1">
                  2. Statutory Deductions & TRAIN Tax
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">
                    Late ({inspectItem.late_minutes}m) & UT ({inspectItem.undertime_minutes}m):
                  </span>
                  <span className="font-mono text-rose-600">-{fmt(inspectItem.late_undertime_deduction)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">Unpaid Leave / LWOP ({inspectItem.lwop_days}d):</span>
                  <span className="font-mono text-rose-600">-{fmt(inspectItem.lwop_deduction)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">SSS Employee Share (MSC {fmt(inspectItem.sss_msc)}):</span>
                  <span className="font-mono text-rose-600">-{fmt(inspectItem.sss_ee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">PhilHealth Employee Share (2.5%):</span>
                  <span className="font-mono text-rose-600">-{fmt(inspectItem.philhealth_ee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">Pag-IBIG Employee Share:</span>
                  <span className="font-mono text-rose-600">-{fmt(inspectItem.pagibig_ee)}</span>
                </div>
                <div className="flex justify-between bg-slate-50 px-2 py-1 rounded">
                  <span className="font-semibold text-slate-700">BIR Taxable Income:</span>
                  <span className="font-mono font-bold">{fmt(inspectItem.taxable_income)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">BIR TRAIN Withholding Tax:</span>
                  <span className="font-mono font-bold text-rose-600">-{fmt(inspectItem.withholding_tax)}</span>
                </div>
                <div className="flex justify-between border-t pt-1.5 font-extrabold text-emerald-700 text-sm">
                  <span>NET TAKE-HOME PAY:</span>
                  <span className="font-mono">{fmt(inspectItem.net_pay)}</span>
                </div>
              </div>

              {inspectItem.computation_details && (
                <div className="md:col-span-2 bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1 text-[11px] text-slate-600">
                  <div className="font-bold text-slate-800">Audit Formula Trace:</div>
                  <div>• <strong>SSS:</strong> {inspectItem.computation_details.sss_formula}</div>
                  <div>• <strong>PhilHealth:</strong> {inspectItem.computation_details.philhealth_formula}</div>
                  <div>• <strong>Pag-IBIG:</strong> {inspectItem.computation_details.pagibig_formula}</div>
                  <div>• <strong>BIR TRAIN Bracket:</strong> {inspectItem.computation_details.tax_bracket}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW PAYROLL CUTOFF */}
      {showNewRunModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Prepare New Payroll Cutoff</h3>
              <button
                onClick={() => setShowNewRunModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleCreateRun} className="p-5 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Run Code</label>
                  <input
                    type="text"
                    value={newRunForm.run_code}
                    onChange={(e) => setNewRunForm({ ...newRunForm, run_code: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-300 px-2.5 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cutoff Type</label>
                  <select
                    value={newRunForm.cutoff_type}
                    onChange={(e) => setNewRunForm({ ...newRunForm, cutoff_type: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-300 px-2"
                  >
                    <option value="semi_monthly_1st">1st Half (Semi-Monthly)</option>
                    <option value="semi_monthly_2nd">2nd Half (Semi-Monthly)</option>
                    <option value="monthly">Monthly Cutoff</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payroll Period Name</label>
                <input
                  type="text"
                  value={newRunForm.name}
                  onChange={(e) => setNewRunForm({ ...newRunForm, name: e.target.value })}
                  className="w-full h-9 rounded-lg border border-slate-300 px-2.5"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Period Start</label>
                  <input
                    type="date"
                    value={newRunForm.period_start}
                    onChange={(e) => setNewRunForm({ ...newRunForm, period_start: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-300 px-2 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Period End</label>
                  <input
                    type="date"
                    value={newRunForm.period_end}
                    onChange={(e) => setNewRunForm({ ...newRunForm, period_end: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-300 px-2 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pay Date</label>
                  <input
                    type="date"
                    value={newRunForm.pay_date}
                    onChange={(e) => setNewRunForm({ ...newRunForm, pay_date: e.target.value })}
                    className="w-full h-9 rounded-lg border border-slate-300 px-2 font-mono"
                    required
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowNewRunModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={processing}>
                  {processing ? 'Creating...' : 'Create Draft Run'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

