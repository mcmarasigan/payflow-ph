import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'
import AppLayout from '@/components/layout/AppLayout'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  UserCheck,
  Shield,
  Calendar,
  Clock,
} from 'lucide-react'

const fmt = (val) =>
  `₱${Number(val || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

export default function EmployeePortalPage() {
  const [activeTab, setActiveTab] = useState('payslips')
  const [employeeId, setEmployeeId] = useState('')
  const [data, setData] = useState(null)
  const [selectedSlip, setSelectedSlip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const fetchPortal = useCallback(async (empId = '') => {
    setLoading(true)
    try {
      const params = empId ? { employee_id: empId } : {}
      const res = await api.get('/portal/overview', { params })
      setData(res.data)
      if (!empId && res.data.employee?.id) {
        setEmployeeId(String(res.data.employee.id))
      }
      if (res.data.payslips?.length) {
        setSelectedSlip(res.data.payslips[0])
      } else {
        setSelectedSlip(null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPortal()
  }, [fetchPortal])

  const handleEmployeeSwitch = (newId) => {
    setEmployeeId(newId)
    fetchPortal(newId)
  }

  const handleDownloadPdf = async (slip) => {
    if (!slip) return
    setDownloadingPdf(true)
    try {
      const res = await api.get(`/portal/payslips/${slip.id}/pdf`, {
        responseType: 'blob',
      })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Payslip-${slip.employee_code}-${slip.run_code}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } finally {
      setDownloadingPdf(false)
    }
  }

  const emp = data?.employee
  const bir = data?.bir_2316_summary

  return (
    <AppLayout
      title="Employee Self-Service Portal & Electronic Payslips"
      subtitle="Official Printable PDF Payslips (DomPDF), BIR Form 2316 Annual Tax Summary, and Personal 201 & Leave Ledger"
      actions={
        selectedSlip && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.print()}
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" /> Print View
            </Button>
            <Button
              size="sm"
              onClick={() => handleDownloadPdf(selectedSlip)}
              disabled={downloadingPdf}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              {downloadingPdf ? 'Generating PDF...' : 'Download Official PDF'}
            </Button>
          </div>
        )
      }
    >
      <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
        {/* Top Bar: Tabs + Employee Switcher (for HR/Payroll/Admin) */}
        <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
            <button
              onClick={() => setActiveTab('payslips')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'payslips' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Electronic Payslips ({data?.payslips?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('bir2316')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'bir2316' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              BIR Form 2316 & YTD Tax Summary
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                activeTab === 'profile' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              My 201 Profile, Leaves & DTR
            </button>
          </div>

          {data?.can_switch_employee && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Preview Employee Portal As:</span>
              <select
                value={employeeId}
                onChange={(e) => handleEmployeeSwitch(e.target.value)}
                className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-800"
              >
                {data.employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.employee_code} — {e.full_name} ({e.position_title})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* TAB 1: ELECTRONIC PAYSLIPS & INTERACTIVE VIEWER */}
        {activeTab === 'payslips' && (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
            {/* Left Sidebar: Cutoff Payslip List (4 cols) */}
            <Card className="lg:col-span-4 flex flex-col min-h-0 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
                <div className="text-xs font-bold text-slate-800">Cutoff Payslip History</div>
                <Badge variant="info">{emp?.employee_code}</Badge>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-200">
                {loading ? (
                  <div className="p-6 text-center text-xs text-slate-400">Loading payslips...</div>
                ) : !data?.payslips?.length ? (
                  <div className="p-6 text-center text-xs text-slate-400">No payslips available.</div>
                ) : (
                  data.payslips.map((slip) => {
                    const isSelected = selectedSlip?.id === slip.id
                    return (
                      <div
                        key={slip.id}
                        onClick={() => setSelectedSlip(slip)}
                        className={`p-3.5 cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/90 border-l-4 border-l-indigo-600'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-indigo-700">
                            {slip.run_code}
                          </span>
                          <Badge
                            variant={slip.run_status === 'locked' ? 'success' : 'warning'}
                          >
                            {slip.run_status === 'locked' ? 'RELEASED' : slip.run_status?.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-xs font-semibold text-slate-900 mt-1">
                          {slip.run_name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Pay Date: {slip.pay_date}
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                          <span className="text-slate-500">Net Take-Home:</span>
                          <span className="font-mono font-extrabold text-emerald-700">
                            {fmt(slip.net_pay)}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </Card>

            {/* Right Area: Detailed Philippine Electronic Payslip (8 cols) */}
            <Card className="lg:col-span-8 flex flex-col min-h-0 overflow-hidden">
              {selectedSlip ? (
                <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
                  {/* Payslip Header Banner */}
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b-2 border-slate-900 pb-3">
                    <div>
                      <div className="text-sm font-extrabold tracking-tight text-slate-900">
                        PAYFLOW PH TECHNOLOGIES INC.
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Confidential Electronic Payslip • 2025/2026 Philippine Statutory Compliance
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-indigo-600">
                        {selectedSlip.run_code}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Period: <strong>{selectedSlip.period_start} → {selectedSlip.period_end}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Employee Snapshot Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                    <div>
                      <div className="text-[10px] uppercase text-slate-400 font-semibold">Employee</div>
                      <div className="font-bold text-slate-900">{selectedSlip.employee_name}</div>
                      <div className="font-mono text-[11px] text-slate-500">{selectedSlip.employee_code}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400 font-semibold">Department & Role</div>
                      <div className="font-semibold text-slate-800">{selectedSlip.position_title}</div>
                      <div className="text-[11px] text-slate-500">{selectedSlip.department_name}</div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400 font-semibold">Monthly Basic</div>
                      <div className="font-mono font-bold text-slate-900">
                        {fmt(selectedSlip.monthly_basic_salary)}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        Daily: {fmt(selectedSlip.daily_rate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase text-slate-400 font-semibold">Disbursement Bank</div>
                      <div className="font-semibold text-slate-800">{emp?.bank_name}</div>
                      <div className="font-mono text-[11px] text-slate-500">{emp?.masked_bank_account}</div>
                    </div>
                  </div>

                  {/* Two-Column Earnings vs Deductions Table */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Earnings Column */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="bg-slate-900 text-white px-3 py-2 text-[11px] font-bold uppercase flex justify-between">
                        <span>Earnings & Allowances</span>
                        <span>Amount (PHP)</span>
                      </div>
                      <div className="p-3 space-y-2 text-xs divide-y divide-slate-100">
                        <div className="flex justify-between pt-1">
                          <span className="text-slate-700">Basic Salary (Cutoff)</span>
                          <span className="font-mono font-semibold">{fmt(selectedSlip.basic_pay)}</span>
                        </div>
                        <div className="flex justify-between pt-1.5">
                          <span className="text-slate-700">
                            DOLE Overtime Pay ({selectedSlip.overtime_hours}h)
                          </span>
                          <span className="font-mono text-indigo-600">
                            {fmt(selectedSlip.overtime_pay)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1.5">
                          <span className="text-slate-700">
                            Night Shift Diff ({selectedSlip.night_diff_hours}h @ 10%)
                          </span>
                          <span className="font-mono text-indigo-600">
                            {fmt(selectedSlip.night_diff_pay)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1.5">
                          <span className="text-slate-700">PH Holiday Premium Pay</span>
                          <span className="font-mono text-indigo-600">
                            {fmt(selectedSlip.holiday_pay)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1.5">
                          <span className="text-slate-700">De Minimis Allowances (Tax-Exempt)</span>
                          <span className="font-mono text-emerald-700">
                            {fmt(selectedSlip.de_minimis_allowance)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 font-bold text-slate-900 bg-slate-50 -mx-3 px-3 pb-1">
                          <span>TOTAL GROSS EARNINGS</span>
                          <span className="font-mono">{fmt(selectedSlip.gross_pay)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Deductions Column */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="bg-slate-900 text-white px-3 py-2 text-[11px] font-bold uppercase flex justify-between">
                        <span>Statutory & Attendance Deductions</span>
                        <span>Amount (PHP)</span>
                      </div>
                      <div className="p-3 space-y-2 text-xs divide-y divide-slate-100">
                        <div className="flex justify-between pt-1">
                          <span className="text-slate-700">
                            SSS Employee Share (MSC {fmt(selectedSlip.sss_msc)})
                          </span>
                          <span className="font-mono text-rose-600">-{fmt(selectedSlip.sss_ee)}</span>
                        </div>
                        <div className="flex justify-between pt-1.5">
                          <span className="text-slate-700">PhilHealth Employee Share (2.5%)</span>
                          <span className="font-mono text-rose-600">
                            -{fmt(selectedSlip.philhealth_ee)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1.5">
                          <span className="text-slate-700">Pag-IBIG / HDMF Employee Share</span>
                          <span className="font-mono text-rose-600">
                            -{fmt(selectedSlip.pagibig_ee)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1.5">
                          <span className="text-slate-700">
                            Tardiness ({selectedSlip.late_minutes}m) & UT ({selectedSlip.undertime_minutes}m)
                          </span>
                          <span className="font-mono text-rose-600">
                            -{fmt(selectedSlip.late_undertime_deduction)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1.5">
                          <span className="text-slate-700">
                            Leave Without Pay ({selectedSlip.lwop_days}d) + TRAIN Tax
                          </span>
                          <span className="font-mono text-rose-600">
                            -{fmt(selectedSlip.lwop_deduction + selectedSlip.withholding_tax)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 font-bold text-rose-700 bg-rose-50/50 -mx-3 px-3 pb-1">
                          <span>TOTAL DEDUCTIONS</span>
                          <span className="font-mono">-{fmt(selectedSlip.total_deductions)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Net Take-Home Pay Box */}
                  <div className="rounded-xl bg-emerald-50 border-2 border-emerald-600 px-5 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-extrabold uppercase text-emerald-900">
                        Net Take-Home Pay (Disbursed via {emp?.bank_name})
                      </div>
                      <div className="text-[11px] text-emerald-700">
                        BIR Taxable Income for Cutoff: <strong>{fmt(selectedSlip.taxable_income)}</strong> • Withholding Tax: <strong>{fmt(selectedSlip.withholding_tax)}</strong>
                      </div>
                    </div>
                    <div className="text-xl font-extrabold font-mono text-emerald-800">
                      {fmt(selectedSlip.net_pay)}
                    </div>
                  </div>

                  {/* Employer Statutory Share Info Bar */}
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-700">
                      Employer Statutory Share (Paid by Company):
                    </span>
                    <div className="flex flex-wrap items-center gap-4 font-mono text-slate-600">
                      <span>SSS ER: <strong>{fmt(selectedSlip.sss_er)}</strong></span>
                      <span>SSS EC: <strong>{fmt(selectedSlip.sss_ec)}</strong></span>
                      <span>PhilHealth ER: <strong>{fmt(selectedSlip.philhealth_er)}</strong></span>
                      <span>Pag-IBIG ER: <strong>{fmt(selectedSlip.pagibig_er)}</strong></span>
                      <span className="text-indigo-600 font-bold">
                        Total ER Cost: {fmt(selectedSlip.total_employer_cost)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">
                  Select a cutoff payslip on the left to inspect or download PDF.
                </div>
              )}
            </Card>
          </div>
        )}

        {/* TAB 2: BIR FORM 2316 & YTD STATUTORY SUMMARY */}
        {activeTab === 'bir2316' && bir && (
          <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  BIR Form 2316 Certificate of Compensation Payment / Tax Withheld — 2026 YTD Summary
                </div>
                <div className="text-[11px] text-slate-500">
                  Employee: <strong>{emp?.full_name} ({emp?.employee_code})</strong> • Masked TIN: <span className="font-mono">{emp?.masked_tin}</span>
                </div>
              </div>
              <Badge variant="success">TRAIN Law (RA 10963) Compliant</Badge>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="border border-slate-200 rounded-xl p-4 space-y-2.5 bg-white">
                <div className="font-bold text-slate-900 uppercase border-b pb-1.5">
                  Part IV-A — Gross & Non-Taxable Compensation
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">YTD Cutoffs Processed (2026):</span>
                  <span className="font-mono font-bold">{bir.cutoffs_included} Cutoffs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">YTD Gross Compensation Income:</span>
                  <span className="font-mono font-bold text-slate-900">{fmt(bir.ytd_gross_compensation)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Less: Non-Taxable De Minimis Benefits:</span>
                  <span className="font-mono text-emerald-700">-{fmt(bir.ytd_non_taxable_de_minimis)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Less: Mandatory SSS EE Contributions:</span>
                  <span className="font-mono text-emerald-700">-{fmt(bir.ytd_mandatory_sss_ee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Less: Mandatory PhilHealth EE Contributions:</span>
                  <span className="font-mono text-emerald-700">-{fmt(bir.ytd_mandatory_philhealth_ee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Less: Mandatory Pag-IBIG EE Contributions:</span>
                  <span className="font-mono text-emerald-700">-{fmt(bir.ytd_mandatory_pagibig_ee)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-indigo-700">
                  <span>YTD Net Taxable Compensation:</span>
                  <span className="font-mono">{fmt(bir.ytd_net_taxable_compensation)}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 space-y-2.5 bg-white">
                <div className="font-bold text-slate-900 uppercase border-b pb-1.5">
                  Part IV-B — Tax Withheld & 13th Month Pay (PD 851)
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">YTD Total Mandatory EE Contributions:</span>
                  <span className="font-mono font-semibold">{fmt(bir.ytd_total_statutory_ee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">YTD Total BIR Withholding Tax Remitted:</span>
                  <span className="font-mono font-bold text-rose-600">{fmt(bir.ytd_withholding_tax_deducted)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">YTD Total Net Pay Disbursed:</span>
                  <span className="font-mono font-bold text-emerald-700">{fmt(bir.ytd_net_disbursed_pay)}</span>
                </div>
                <div className="border-t pt-2.5 font-bold text-slate-800">
                  Projected 2026 13th Month Pay & ₱90,000 Exemption Ceiling:
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Projected Gross 13th Month Pay:</span>
                  <span className="font-mono font-bold">{fmt(bir.projected_13th_month_pay)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tax-Exempt Portion (≤ ₱90,000 Ceiling):</span>
                  <span className="font-mono font-semibold text-emerald-700">{fmt(bir.tax_exempt_13th_month)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Taxable Excess Over ₱90,000:</span>
                  <span className="font-mono font-semibold text-rose-600">{fmt(bir.taxable_excess_13th_month)}</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* TAB 3: MY 201 PROFILE, LEAVE CREDITS & RECENT DTR */}
        {activeTab === 'profile' && emp && (
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
            {/* 201 Profile Card with Masked IDs (5 cols) */}
            <Card className="lg:col-span-5 flex flex-col min-h-0 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{emp.full_name}</h3>
                  <p className="text-xs text-slate-500">
                    {emp.employee_code} • {emp.position_title}
                  </p>
                </div>
                <Badge variant="success">{emp.employment_type?.toUpperCase()}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 uppercase">Department</div>
                  <div className="font-semibold text-slate-800">{emp.department_name}</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 uppercase">Work Schedule</div>
                  <div className="font-mono font-semibold text-slate-800">{emp.work_schedule}</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 uppercase">Hire Date</div>
                  <div className="font-mono font-semibold text-slate-800">{emp.hire_date}</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 uppercase">Monthly Basic + De Minimis</div>
                  <div className="font-mono font-bold text-indigo-700">
                    {fmt(emp.basic_salary)} + {fmt(emp.total_allowances)}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-2.5 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Shield className="h-3.5 w-3.5 text-indigo-600" />
                  Encrypted Statutory IDs (Privacy Masked in Self-Service)
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between">
                    <span className="text-slate-500">SSS:</span>
                    <span className="font-bold text-slate-800">{emp.masked_sss}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between">
                    <span className="text-slate-500">PhilHealth:</span>
                    <span className="font-bold text-slate-800">{emp.masked_philhealth}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between">
                    <span className="text-slate-500">Pag-IBIG:</span>
                    <span className="font-bold text-slate-800">{emp.masked_pagibig}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between">
                    <span className="text-slate-500">BIR TIN:</span>
                    <span className="font-bold text-slate-800">{emp.masked_tin}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Right Column: Leave Balances & Recent DTR (7 cols) */}
            <Card className="lg:col-span-7 flex flex-col min-h-0 overflow-y-auto p-4 space-y-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
                  <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                  2026 Leave Credits Balance (Statutory SIL vs Company VL/SL)
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {data.leave_balances.map((lb) => (
                    <div
                      key={lb.id}
                      className="rounded-lg border border-slate-200 p-3 bg-slate-50/70"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-indigo-700">
                          {lb.leave_code}
                        </span>
                        <Badge variant={lb.category === 'statutory' ? 'warning' : 'info'}>
                          {lb.category}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-600 truncate mt-0.5">{lb.leave_name}</div>
                      <div className="mt-2 flex items-baseline justify-between font-mono">
                        <span className="text-lg font-extrabold text-emerald-700">
                          {lb.remaining_days.toFixed(1)}d
                        </span>
                        <span className="text-[10px] text-slate-500">
                          of {lb.entitled_days.toFixed(1)}d ({lb.used_days.toFixed(1)}d used)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
                  <Clock className="h-3.5 w-3.5 text-indigo-600" />
                  Recent Daily Time Record (DTR) Logs
                </div>
                <table className="w-full text-left border-collapse border border-slate-200 text-xs">
                  <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-2">Day Type</th>
                      <th className="py-2 px-2">In / Out</th>
                      <th className="py-2 px-2 text-right">Worked</th>
                      <th className="py-2 px-2 text-right">Late / NSD</th>
                      <th className="py-2 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.recent_dtr.map((d) => (
                      <tr key={d.id}>
                        <td className="py-1.5 px-3 font-mono">{d.work_date?.slice(0, 10)}</td>
                        <td className="py-1.5 px-2">{d.day_type}</td>
                        <td className="py-1.5 px-2 font-mono">{d.time_in}–{d.time_out}</td>
                        <td className="py-1.5 px-2 text-right font-mono">{d.worked_hours}h</td>
                        <td className="py-1.5 px-2 text-right font-mono">
                          {d.late_minutes > 0 ? `${d.late_minutes}m late` : '0m'}
                          {Number(d.night_diff_hours) > 0 ? ` / ${d.night_diff_hours}h NSD` : ''}
                        </td>
                        <td className="py-1.5 px-3 text-slate-500 truncate max-w-44">{d.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
