<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Department;
use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Models\OvertimeRequest;
use App\Models\PayrollItem;
use App\Models\PayrollRun;
use App\Services\PhilippinePayrollCalculator;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Artisan;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PortalAndReportsController extends Controller
{
    public function portalOverview(Request $request): JsonResponse
    {
        $user = $request->user();
        $canViewAll = $user?->can('payslips.view_all') || $user?->hasRole(['Super Admin', 'HR Manager', 'Payroll Officer', 'Approver / Finance']);

        $employeesList = Employee::select('id', 'employee_code', 'first_name', 'last_name', 'email', 'department_id', 'position_id')
            ->with(['department:id,name', 'position:id,title'])
            ->orderBy('employee_code')
            ->get()
            ->map(fn (Employee $e) => [
                'id' => $e->id,
                'employee_code' => $e->employee_code,
                'full_name' => $e->full_name,
                'position_title' => $e->position?->title,
                'department_name' => $e->department?->name,
            ]);

        $requestedEmpId = $request->integer('employee_id');

        if ($canViewAll && $requestedEmpId) {
            $employee = Employee::with(['department:id,name', 'position:id,title'])->findOrFail($requestedEmpId);
        } else {
            $employee = Employee::with(['department:id,name', 'position:id,title'])
                ->where('email', $user?->email)
                ->first()
                ?? Employee::with(['department:id,name', 'position:id,title'])->orderBy('id')->firstOrFail();
        }

        $payslips = PayrollItem::with('payrollRun')
            ->where('employee_id', $employee->id)
            ->orderByDesc('id')
            ->get()
            ->map(fn (PayrollItem $item) => [
                'id' => $item->id,
                'payroll_run_id' => $item->payroll_run_id,
                'run_code' => $item->payrollRun?->run_code,
                'run_name' => $item->payrollRun?->name,
                'period_start' => $item->payrollRun?->period_start?->format('Y-m-d'),
                'period_end' => $item->payrollRun?->period_end?->format('Y-m-d'),
                'pay_date' => $item->payrollRun?->pay_date?->format('Y-m-d'),
                'run_status' => $item->payrollRun?->status,
                'employee_code' => $item->employee_code,
                'employee_name' => $item->employee_name,
                'department_name' => $item->department_name,
                'position_title' => $item->position_title,
                'monthly_basic_salary' => (float) $item->monthly_basic_salary,
                'daily_rate' => (float) $item->daily_rate,
                'hourly_rate' => (float) $item->hourly_rate,
                'basic_pay' => (float) $item->basic_pay,
                'overtime_hours' => (float) $item->overtime_hours,
                'overtime_pay' => (float) $item->overtime_pay,
                'night_diff_hours' => (float) $item->night_diff_hours,
                'night_diff_pay' => (float) $item->night_diff_pay,
                'holiday_pay' => (float) $item->holiday_pay,
                'de_minimis_allowance' => (float) $item->de_minimis_allowance,
                'gross_pay' => (float) $item->gross_pay,
                'late_minutes' => $item->late_minutes,
                'undertime_minutes' => $item->undertime_minutes,
                'late_undertime_deduction' => (float) $item->late_undertime_deduction,
                'lwop_days' => (float) $item->lwop_days,
                'lwop_deduction' => (float) $item->lwop_deduction,
                'sss_msc' => (float) $item->sss_msc,
                'sss_ee' => (float) $item->sss_ee,
                'philhealth_ee' => (float) $item->philhealth_ee,
                'pagibig_ee' => (float) $item->pagibig_ee,
                'taxable_income' => (float) $item->taxable_income,
                'withholding_tax' => (float) $item->withholding_tax,
                'sss_er' => (float) $item->sss_er,
                'sss_ec' => (float) $item->sss_ec,
                'philhealth_er' => (float) $item->philhealth_er,
                'pagibig_er' => (float) $item->pagibig_er,
                'total_employer_cost' => (float) $item->total_employer_cost,
                'total_deductions' => (float) $item->total_deductions,
                'net_pay' => (float) $item->net_pay,
                'computation_details' => $item->computation_details,
            ]);

        // Compute YTD & BIR Form 2316 Annual Summary Preview
        $thirteenth = PhilippinePayrollCalculator::computeThirteenthMonth($employee, 2026);
        $ytdGross = round($payslips->sum('gross_pay'), 2);
        $ytdDeMinimis = round($payslips->sum('de_minimis_allowance'), 2);
        $ytdSssEe = round($payslips->sum('sss_ee'), 2);
        $ytdPhilHealthEe = round($payslips->sum('philhealth_ee'), 2);
        $ytdPagIbigEe = round($payslips->sum('pagibig_ee'), 2);
        $ytdTaxable = round($payslips->sum('taxable_income'), 2);
        $ytdTaxWithheld = round($payslips->sum('withholding_tax'), 2);
        $ytdNetPay = round($payslips->sum('net_pay'), 2);

        $leaveBalances = LeaveBalance::with('leaveType:id,code,name,category,is_paid')
            ->where('employee_id', $employee->id)
            ->where('year', 2026)
            ->get()
            ->map(fn (LeaveBalance $b) => [
                'id' => $b->id,
                'leave_code' => $b->leaveType?->code,
                'leave_name' => $b->leaveType?->name,
                'category' => $b->leaveType?->category,
                'entitled_days' => (float) $b->entitled_days,
                'used_days' => (float) $b->used_days,
                'pending_days' => (float) $b->pending_days,
                'remaining_days' => $b->remaining_days,
            ]);

        $recentDtr = Attendance::where('employee_id', $employee->id)
            ->orderByDesc('work_date')
            ->limit(10)
            ->get();

        $recentOvertime = OvertimeRequest::where('employee_id', $employee->id)
            ->orderByDesc('work_date')
            ->limit(10)
            ->get();

        return response()->json([
            'can_switch_employee' => (bool) $canViewAll,
            'employees' => $employeesList,
            'employee' => [
                'id' => $employee->id,
                'employee_code' => $employee->employee_code,
                'full_name' => $employee->full_name,
                'email' => $employee->email,
                'phone' => $employee->phone,
                'department_name' => $employee->department?->name,
                'position_title' => $employee->position?->title,
                'employment_type' => $employee->employment_type,
                'employment_status' => $employee->employment_status,
                'hire_date' => $employee->hire_date?->format('Y-m-d'),
                'regularization_date' => $employee->regularization_date?->format('Y-m-d'),
                'basic_salary' => (float) $employee->basic_salary,
                'total_allowances' => $employee->total_allowances,
                'work_schedule' => ($employee->work_schedule_start ?? '09:00').' – '.($employee->work_schedule_end ?? '18:00'),
                'masked_sss' => Employee::maskId($employee->sss_no),
                'masked_philhealth' => Employee::maskId($employee->philhealth_no),
                'masked_pagibig' => Employee::maskId($employee->pagibig_no),
                'masked_tin' => Employee::maskId($employee->tin_no),
                'bank_name' => $employee->bank_name,
                'masked_bank_account' => Employee::maskId($employee->bank_account_no),
            ],
            'payslips' => $payslips,
            'bir_2316_summary' => [
                'tax_year' => 2026,
                'cutoffs_included' => $payslips->count(),
                'ytd_gross_compensation' => $ytdGross,
                'ytd_non_taxable_de_minimis' => $ytdDeMinimis,
                'ytd_mandatory_sss_ee' => $ytdSssEe,
                'ytd_mandatory_philhealth_ee' => $ytdPhilHealthEe,
                'ytd_mandatory_pagibig_ee' => $ytdPagIbigEe,
                'ytd_total_statutory_ee' => round($ytdSssEe + $ytdPhilHealthEe + $ytdPagIbigEe, 2),
                'ytd_net_taxable_compensation' => $ytdTaxable,
                'ytd_withholding_tax_deducted' => $ytdTaxWithheld,
                'ytd_net_disbursed_pay' => $ytdNetPay,
                'projected_13th_month_pay' => $thirteenth['gross_thirteenth_month'],
                'tax_exempt_13th_month' => $thirteenth['tax_exempt_portion'],
                'taxable_excess_13th_month' => $thirteenth['taxable_excess_over_90k'],
            ],
            'leave_balances' => $leaveBalances,
            'recent_dtr' => $recentDtr,
            'recent_overtime' => $recentOvertime,
        ]);
    }

    public function downloadPayslipPdf(Request $request, PayrollItem $payrollItem): Response
    {
        $payrollItem->load('payrollRun');

        activity('payslips')
            ->performedOn($payrollItem)
            ->causedBy($request->user())
            ->withProperties([
                'employee_code' => $payrollItem->employee_code,
                'run_code' => $payrollItem->payrollRun?->run_code,
                'ip' => $request->ip(),
            ])
            ->event('payslip_pdf_downloaded')
            ->log("Downloaded PDF payslip for {$payrollItem->employee_code} ({$payrollItem->payrollRun?->run_code})");

        $pdf = Pdf::loadView('pdf.payslip', [
            'item' => $payrollItem,
            'run' => $payrollItem->payrollRun,
        ])->setPaper('a4', 'portrait');

        $filename = "Payslip-{$payrollItem->employee_code}-{$payrollItem->payrollRun?->run_code}.pdf";

        return $pdf->download($filename);
    }

    public function executiveAnalytics(): JsonResponse
    {
        $employees = Employee::with('department:id,code,name')
            ->where('employment_status', 'active')
            ->get();

        $latestRun = PayrollRun::with('items')
            ->orderByDesc('period_start')
            ->first();

        $departmentBreakdown = Department::withCount('employees')
            ->get()
            ->map(function (Department $dept) use ($employees, $latestRun) {
                $deptEmps = $employees->where('department_id', $dept->id);
                $monthlyBasic = round((float) $deptEmps->sum('basic_salary'), 2);
                $cutoffGross = $latestRun
                    ? round((float) $latestRun->items->where('department_name', $dept->name)->sum('gross_pay'), 2)
                    : round($monthlyBasic / 2, 2);

                return [
                    'code' => $dept->code,
                    'name' => $dept->name,
                    'headcount' => $dept->employees_count,
                    'monthly_basic_total' => $monthlyBasic,
                    'latest_cutoff_gross' => $cutoffGross,
                ];
            });

        $remittanceSchedule = PayrollRun::with('items')
            ->orderByDesc('period_start')
            ->get()
            ->map(function (PayrollRun $run) {
                $sssEe = round((float) $run->items->sum('sss_ee'), 2);
                $sssEr = round((float) $run->items->sum('sss_er'), 2);
                $sssEc = round((float) $run->items->sum('sss_ec'), 2);

                $phEe = round((float) $run->items->sum('philhealth_ee'), 2);
                $phEr = round((float) $run->items->sum('philhealth_er'), 2);

                $piEe = round((float) $run->items->sum('pagibig_ee'), 2);
                $piEr = round((float) $run->items->sum('pagibig_er'), 2);

                $birTax = round((float) $run->items->sum('withholding_tax'), 2);

                return [
                    'id' => $run->id,
                    'run_code' => $run->run_code,
                    'name' => $run->name,
                    'status' => $run->status,
                    'pay_date' => $run->pay_date?->format('Y-m-d'),
                    'sss_total' => round($sssEe + $sssEr + $sssEc, 2),
                    'sss_ee' => $sssEe,
                    'sss_er_ec' => round($sssEr + $sssEc, 2),
                    'philhealth_total' => round($phEe + $phEr, 2),
                    'philhealth_ee' => $phEe,
                    'philhealth_er' => $phEr,
                    'pagibig_total' => round($piEe + $piEr, 2),
                    'pagibig_ee' => $piEe,
                    'pagibig_er' => $piEr,
                    'bir_1601c_tax' => $birTax,
                    'grand_total_remittance' => round($sssEe + $sssEr + $sssEc + $phEe + $phEr + $piEe + $piEr + $birTax, 2),
                ];
            });

        $recentLogs = Activity::with('causer:id,name,email')
            ->latest()
            ->limit(25)
            ->get()
            ->map(fn (Activity $log) => [
                'id' => $log->id,
                'log_name' => $log->log_name,
                'event' => $log->event,
                'description' => $log->description,
                'causer_name' => $log->causer?->name ?? 'System Seeder',
                'causer_email' => $log->causer?->email ?? 'system@payflow.ph',
                'properties' => $log->properties,
                'created_at' => $log->created_at?->toIso8601String(),
            ]);

        $monthlyBasicTotal = round((float) $employees->sum('basic_salary'), 2);
        $latestRemittance = $remittanceSchedule->first();

        return response()->json([
            'kpis' => [
                'active_headcount' => $employees->count(),
                'monthly_basic_run_rate' => $monthlyBasicTotal,
                'latest_run_code' => $latestRun?->run_code ?? 'N/A',
                'latest_net_disbursement' => (float) ($latestRun?->total_net_pay ?? 0),
                'latest_statutory_remittance' => (float) ($latestRemittance['grand_total_remittance'] ?? 0),
            ],
            'department_breakdown' => $departmentBreakdown,
            'remittance_schedule' => $remittanceSchedule,
            'audit_logs' => $recentLogs,
        ]);
    }

    public function exportPayrollRunCsv(Request $request, PayrollRun $payrollRun): StreamedResponse
    {
        $payrollRun->load('items');

        activity('payroll')
            ->performedOn($payrollRun)
            ->causedBy($request->user())
            ->withProperties([
                'run_code' => $payrollRun->run_code,
                'format' => 'csv',
                'ip' => $request->ip(),
            ])
            ->event('payroll_csv_exported')
            ->log("Exported bank payroll & statutory register CSV for {$payrollRun->run_code}");

        $filename = "Payroll-Register-{$payrollRun->run_code}.csv";

        return response()->streamDownload(function () use ($payrollRun) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'Run Code',
                'Employee Code',
                'Employee Name',
                'Department',
                'Position',
                'Monthly Basic',
                'Basic Cutoff Pay',
                'Overtime Pay',
                'Night Diff Pay',
                'Holiday Pay',
                'De Minimis Allowance',
                'Gross Pay',
                'Late/UT Deduction',
                'LWOP Deduction',
                'SSS EE',
                'PhilHealth EE',
                'Pag-IBIG EE',
                'BIR Taxable Income',
                'BIR Withholding Tax',
                'Total Deductions',
                'Net Pay',
                'SSS ER+EC',
                'PhilHealth ER',
                'Pag-IBIG ER',
                'Total Employer Share',
            ]);

            foreach ($payrollRun->items as $item) {
                fputcsv($handle, [
                    $payrollRun->run_code,
                    $item->employee_code,
                    $item->employee_name,
                    $item->department_name,
                    $item->position_title,
                    number_format((float) $item->monthly_basic_salary, 2, '.', ''),
                    number_format((float) $item->basic_pay, 2, '.', ''),
                    number_format((float) $item->overtime_pay, 2, '.', ''),
                    number_format((float) $item->night_diff_pay, 2, '.', ''),
                    number_format((float) $item->holiday_pay, 2, '.', ''),
                    number_format((float) $item->de_minimis_allowance, 2, '.', ''),
                    number_format((float) $item->gross_pay, 2, '.', ''),
                    number_format((float) $item->late_undertime_deduction, 2, '.', ''),
                    number_format((float) $item->lwop_deduction, 2, '.', ''),
                    number_format((float) $item->sss_ee, 2, '.', ''),
                    number_format((float) $item->philhealth_ee, 2, '.', ''),
                    number_format((float) $item->pagibig_ee, 2, '.', ''),
                    number_format((float) $item->taxable_income, 2, '.', ''),
                    number_format((float) $item->withholding_tax, 2, '.', ''),
                    number_format((float) $item->total_deductions, 2, '.', ''),
                    number_format((float) $item->net_pay, 2, '.', ''),
                    number_format((float) $item->sss_er + (float) $item->sss_ec, 2, '.', ''),
                    number_format((float) $item->philhealth_er, 2, '.', ''),
                    number_format((float) $item->pagibig_er, 2, '.', ''),
                    number_format((float) $item->total_employer_cost, 2, '.', ''),
                ]);
            }

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function resetDemoDatabase(Request $request): JsonResponse
    {
        Artisan::call('payflow:reset-demo');

        activity('system')
            ->causedBy($request->user())
            ->withProperties(['ip' => $request->ip()])
            ->event('demo_database_reset')
            ->log('Triggered manual reset of synthetic demonstration database');

        return response()->json([
            'message' => 'PayFlow PH demonstration data has been reset to its initial state.',
        ]);
    }
}
