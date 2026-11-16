<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\OvertimeRequest;
use App\Models\PayrollRun;
use Carbon\Carbon;

class PhilippinePayrollCalculator
{
    /**
     * 2025/2026 SSS Contribution Schedule (RA 11199)
     * - 15% total rate (5% EE, 10% ER)
     * - MSC range: ₱5,000 to ₱35,000 in ₱500 steps (Regular up to ₱20k, MPF/WISP ₱20.5k–₱35k)
     * - EC (Employer only): ₱10.00 for MSC <= ₱14,500; ₱30.00 for MSC >= ₱15,000
     */
    public static function computeSss(float $monthlySalary): array
    {
        if ($monthlySalary < 5250.0) {
            $msc = 5000.0;
        } elseif ($monthlySalary >= 34750.0) {
            $msc = 35000.0;
        } else {
            $msc = floor(($monthlySalary + 250.0) / 500.0) * 500.0;
        }

        $regularMsc = min($msc, 20000.0);
        $mpfMsc = max(0.0, $msc - 20000.0);

        $ee = round($msc * 0.05, 2);
        $er = round($msc * 0.10, 2);
        $ec = $msc >= 15000.0 ? 30.00 : 10.00;

        return [
            'msc' => $msc,
            'regular_msc' => $regularMsc,
            'mpf_msc' => $mpfMsc,
            'ee_monthly' => $ee,
            'er_monthly' => $er,
            'ec_monthly' => $ec,
            'total_monthly' => round($ee + $er + $ec, 2),
        ];
    }

    /**
     * 2025/2026 PhilHealth Contribution Schedule
     * - 5.0% premium rate split equally (2.5% EE, 2.5% ER)
     * - Floor: ₱10,000.00 | Ceiling: ₱100,000.00
     */
    public static function computePhilHealth(float $monthlySalary): array
    {
        $basis = min(100000.0, max(10000.0, $monthlySalary));
        $ee = round($basis * 0.025, 2);
        $er = round($basis * 0.025, 2);

        return [
            'salary_basis' => $basis,
            'rate' => 0.05,
            'ee_monthly' => $ee,
            'er_monthly' => $er,
            'total_monthly' => round($ee + $er, 2),
        ];
    }

    /**
     * 2024/2025/2026 Pag-IBIG (HDMF) Contribution Schedule
     * - Tier 1 (Monthly Basic <= ₱1,500): 1% EE / 2% ER
     * - Tier 2 (Monthly Basic > ₱1,500): 2% EE / 2% ER
     * - Maximum Fund Salary (MFS) Ceiling: ₱10,000.00 (Max ₱200 EE / ₱200 ER)
     */
    public static function computePagIbig(float $monthlySalary): array
    {
        $mfs = min(10000.0, max(0.0, $monthlySalary));
        $eeRate = $monthlySalary <= 1500.0 ? 0.01 : 0.02;
        $erRate = 0.02;

        $ee = round($mfs * $eeRate, 2);
        $er = round($mfs * $erRate, 2);

        return [
            'mfs_basis' => $mfs,
            'ee_rate' => $eeRate,
            'er_rate' => $erRate,
            'ee_monthly' => $ee,
            'er_monthly' => $er,
            'total_monthly' => round($ee + $er, 2),
        ];
    }

    /**
     * BIR Withholding Tax (TRAIN Law RA 10963 Effective 2023–2026)
     */
    public static function computeTrainWithholdingTax(float $taxableIncome, string $period = 'semi_monthly'): array
    {
        $factor = $period === 'monthly' ? 2.0 : 1.0;

        $b1 = 10416.67 * $factor;
        $b2 = 16666.67 * $factor;
        $b3 = 33333.33 * $factor;
        $b4 = 83333.33 * $factor;
        $b5 = 333333.33 * $factor;

        if ($taxableIncome <= $b1) {
            return [
                'tax' => 0.00,
                'bracket_label' => 'Bracket 1 (0% Tax Exempt)',
                'rate_percent' => 0,
                'base_tax' => 0.00,
                'excess_over' => 0.00,
            ];
        }

        if ($taxableIncome <= $b2) {
            $tax = ($taxableIncome - $b1) * 0.15;
            return [
                'tax' => round($tax, 2),
                'bracket_label' => 'Bracket 2 (15% over ₱'.number_format($b1, 2).')',
                'rate_percent' => 15,
                'base_tax' => 0.00,
                'excess_over' => round($b1, 2),
            ];
        }

        if ($taxableIncome <= $b3) {
            $base = 937.50 * $factor;
            $tax = $base + ($taxableIncome - $b2) * 0.20;
            return [
                'tax' => round($tax, 2),
                'bracket_label' => 'Bracket 3 (₱'.number_format($base, 2).' + 20% over ₱'.number_format($b2, 2).')',
                'rate_percent' => 20,
                'base_tax' => round($base, 2),
                'excess_over' => round($b2, 2),
            ];
        }

        if ($taxableIncome <= $b4) {
            $base = 4270.83 * $factor;
            $tax = $base + ($taxableIncome - $b3) * 0.25;
            return [
                'tax' => round($tax, 2),
                'bracket_label' => 'Bracket 4 (₱'.number_format($base, 2).' + 25% over ₱'.number_format($b3, 2).')',
                'rate_percent' => 25,
                'base_tax' => round($base, 2),
                'excess_over' => round($b3, 2),
            ];
        }

        if ($taxableIncome <= $b5) {
            $base = 16770.83 * $factor;
            $tax = $base + ($taxableIncome - $b4) * 0.30;
            return [
                'tax' => round($tax, 2),
                'bracket_label' => 'Bracket 5 (₱'.number_format($base, 2).' + 30% over ₱'.number_format($b4, 2).')',
                'rate_percent' => 30,
                'base_tax' => round($base, 2),
                'excess_over' => round($b4, 2),
            ];
        }

        $base = 91770.83 * $factor;
        $tax = $base + ($taxableIncome - $b5) * 0.35;

        return [
            'tax' => round($tax, 2),
            'bracket_label' => 'Bracket 6 (₱'.number_format($base, 2).' + 35% over ₱'.number_format($b5, 2).')',
            'rate_percent' => 35,
            'base_tax' => round($base, 2),
            'excess_over' => round($b5, 2),
        ];
    }

    /**
     * PD 851 13th Month Pay & TRAIN Law ₱90,000 Tax Exemption Cap
     */
    public static function computeThirteenthMonth(Employee $employee, int $year = 2026): array
    {
        $hireDate = $employee->hire_date ? Carbon::parse($employee->hire_date) : Carbon::create($year, 1, 1);
        $yearStart = Carbon::create($year, 1, 1);
        $yearEnd = Carbon::create($year, 12, 31);

        $effectiveStart = $hireDate->greaterThan($yearStart) ? $hireDate : $yearStart;
        $monthsWorked = max(1.0, round($effectiveStart->diffInMonths($yearEnd->addDay()), 1));
        $monthsWorked = min(12.0, $monthsWorked);

        $monthlyBasic = (float) $employee->basic_salary;
        $totalBasicEarned = round($monthlyBasic * $monthsWorked, 2);
        $thirteenthMonth = round($totalBasicEarned / 12.0, 2);

        $taxExemptPortion = min(90000.00, $thirteenthMonth);
        $taxableExcess = max(0.00, round($thirteenthMonth - 90000.00, 2));

        return [
            'employee_id' => $employee->id,
            'employee_code' => $employee->employee_code,
            'employee_name' => $employee->full_name,
            'department_name' => $employee->department?->name ?? 'General',
            'hire_date' => $hireDate->format('Y-m-d'),
            'monthly_basic_salary' => $monthlyBasic,
            'months_worked_in_year' => $monthsWorked,
            'total_basic_earned' => $totalBasicEarned,
            'gross_thirteenth_month' => $thirteenthMonth,
            'tax_exempt_portion' => $taxExemptPortion,
            'taxable_excess_over_90k' => $taxableExcess,
        ];
    }

    /**
     * Computes a complete PayrollItem payload for an employee within a PayrollRun cutoff
     */
    public static function computeForEmployee(Employee $employee, PayrollRun $run): array
    {
        $isMonthly = $run->cutoff_type === 'monthly';
        $cutoffDivisor = $isMonthly ? 1.0 : 2.0;
        $periodKey = $isMonthly ? 'monthly' : 'semi_monthly';

        $monthlyBasic = (float) $employee->basic_salary;
        $dailyRate = round(($monthlyBasic * 12.0) / 261.0, 2);
        $hourlyRate = round($dailyRate / 8.0, 2);
        $minuteRate = $hourlyRate / 60.0;

        $basicPay = round($monthlyBasic / $cutoffDivisor, 2);
        $deMinimis = round(
            ((float) $employee->rice_subsidy +
             (float) $employee->clothing_allowance +
             (float) $employee->laundry_allowance +
             (float) $employee->medical_allowance) / $cutoffDivisor,
            2
        );

        $start = $run->period_start->format('Y-m-d');
        $end = $run->period_end->format('Y-m-d');

        // 1. Attendance logs in period (Late, Undertime, NSD, Holiday premium)
        $attendances = Attendance::where('employee_id', $employee->id)
            ->whereBetween('work_date', [$start, $end])
            ->get();

        $lateMinutes = (int) $attendances->sum('late_minutes');
        $undertimeMinutes = (int) $attendances->sum('undertime_minutes');
        $lateUndertimeDeduction = round(($lateMinutes + $undertimeMinutes) * $minuteRate, 2);

        $dtrNsdHours = (float) $attendances->sum('night_diff_hours');

        $holidayPay = 0.0;
        foreach ($attendances as $att) {
            if ($att->day_type === 'regular_holiday') {
                $holidayPay += $dailyRate * 1.00; // +100% holiday premium on top of basic
            } elseif ($att->day_type === 'regular_holiday_rest_day') {
                $holidayPay += $dailyRate * 1.60;
            } elseif ($att->day_type === 'special_non_working') {
                $holidayPay += $dailyRate * 0.30;
            } elseif ($att->day_type === 'special_rest_day') {
                $holidayPay += $dailyRate * 0.50;
            }
        }
        $holidayPay = round($holidayPay, 2);

        // 2. Approved DOLE Overtime requests in period
        $overtimes = OvertimeRequest::where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->whereBetween('work_date', [$start, $end])
            ->get();

        $overtimeHours = 0.0;
        $overtimePay = 0.0;
        $otNsdHours = 0.0;
        $otNsdPay = 0.0;

        foreach ($overtimes as $ot) {
            $hrs = (float) $ot->hours_requested;
            $mult = (float) $ot->dole_multiplier;
            $nsdHrs = (float) $ot->night_diff_hours;

            $overtimeHours += $hrs;
            $overtimePay += $hourlyRate * $mult * $hrs;

            $otNsdHours += $nsdHrs;
            $otNsdPay += $hourlyRate * $mult * 0.10 * $nsdHrs;
        }
        $overtimeHours = round($overtimeHours, 2);
        $overtimePay = round($overtimePay, 2);

        $totalNightDiffHours = round($dtrNsdHours + $otNsdHours, 2);
        $dtrNsdPay = round($dtrNsdHours * $hourlyRate * 0.10, 2);
        $nightDiffPay = round($dtrNsdPay + $otNsdPay, 2);

        // 3. Approved Unpaid Leaves (LWOP) in period
        $lwopRequests = LeaveRequest::where('employee_id', $employee->id)
            ->where('status', 'approved')
            ->where('is_paid', false)
            ->whereBetween('start_date', [$start, $end])
            ->get();

        $lwopDays = round((float) $lwopRequests->sum('total_days'), 2);
        $lwopDeduction = round($lwopDays * $dailyRate, 2);

        // 4. Statutory Contributions (pro-rated by cutoffDivisor)
        $sss = self::computeSss($monthlyBasic);
        $philhealth = self::computePhilHealth($monthlyBasic);
        $pagibig = self::computePagIbig($monthlyBasic);

        $sssEe = round($sss['ee_monthly'] / $cutoffDivisor, 2);
        $sssEr = round($sss['er_monthly'] / $cutoffDivisor, 2);
        $sssEc = round($sss['ec_monthly'] / $cutoffDivisor, 2);

        $philhealthEe = round($philhealth['ee_monthly'] / $cutoffDivisor, 2);
        $philhealthEr = round($philhealth['er_monthly'] / $cutoffDivisor, 2);

        $pagibigEe = round($pagibig['ee_monthly'] / $cutoffDivisor, 2);
        $pagibigEr = round($pagibig['er_monthly'] / $cutoffDivisor, 2);

        // 5. Gross Pay & BIR TRAIN Taxable Income
        $grossPay = round(
            $basicPay + $overtimePay + $nightDiffPay + $holidayPay + $deMinimis,
            2
        );

        // Taxable Income excludes non-taxable De Minimis and subtracts attendance deductions + mandatory EE contributions
        $taxableEarnings = $basicPay + $overtimePay + $nightDiffPay + $holidayPay;
        $preTaxDeductions = $lateUndertimeDeduction + $lwopDeduction + $sssEe + $philhealthEe + $pagibigEe;
        $taxableIncome = max(0.0, round($taxableEarnings - $preTaxDeductions, 2));

        $trainTax = self::computeTrainWithholdingTax($taxableIncome, $periodKey);
        $withholdingTax = $trainTax['tax'];

        $totalDeductions = round(
            $lateUndertimeDeduction + $lwopDeduction + $sssEe + $philhealthEe + $pagibigEe + $withholdingTax,
            2
        );

        $netPay = round($grossPay - $totalDeductions, 2);
        $totalEmployerCost = round($sssEr + $sssEc + $philhealthEr + $pagibigEr, 2);

        return [
            'employee_id' => $employee->id,
            'employee_code' => $employee->employee_code,
            'employee_name' => $employee->full_name,
            'department_name' => $employee->department?->name ?? 'General',
            'position_title' => $employee->position?->title ?? 'Staff',
            'monthly_basic_salary' => $monthlyBasic,
            'daily_rate' => $dailyRate,
            'hourly_rate' => $hourlyRate,
            'basic_pay' => $basicPay,
            'overtime_hours' => $overtimeHours,
            'overtime_pay' => $overtimePay,
            'night_diff_hours' => $totalNightDiffHours,
            'night_diff_pay' => $nightDiffPay,
            'holiday_pay' => $holidayPay,
            'de_minimis_allowance' => $deMinimis,
            'other_allowances' => 0.00,
            'thirteenth_month_pay' => 0.00,
            'gross_pay' => $grossPay,
            'late_minutes' => $lateMinutes,
            'undertime_minutes' => $undertimeMinutes,
            'late_undertime_deduction' => $lateUndertimeDeduction,
            'lwop_days' => $lwopDays,
            'lwop_deduction' => $lwopDeduction,
            'sss_msc' => $sss['msc'],
            'sss_ee' => $sssEe,
            'philhealth_ee' => $philhealthEe,
            'pagibig_ee' => $pagibigEe,
            'taxable_income' => $taxableIncome,
            'withholding_tax' => $withholdingTax,
            'sss_er' => $sssEr,
            'sss_ec' => $sssEc,
            'philhealth_er' => $philhealthEr,
            'pagibig_er' => $pagibigEr,
            'total_employer_cost' => $totalEmployerCost,
            'total_deductions' => $totalDeductions,
            'net_pay' => $netPay,
            'computation_details' => [
                'cutoff_divisor' => $cutoffDivisor,
                'sss_formula' => "MSC ₱".number_format($sss['msc'])." (Reg ₱".number_format($sss['regular_msc'])." + MPF ₱".number_format($sss['mpf_msc']).") × 5% EE ÷ {$cutoffDivisor}",
                'philhealth_formula' => "Basis ₱".number_format($philhealth['salary_basis'])." × 2.5% EE ÷ {$cutoffDivisor}",
                'pagibig_formula' => "MFS ₱".number_format($pagibig['mfs_basis'])." × ".($pagibig['ee_rate'] * 100)."% EE ÷ {$cutoffDivisor}",
                'tax_bracket' => $trainTax['bracket_label'],
                'de_minimis_note' => 'Exempt from Withholding Tax under BIR Revenue Regulations (Rice, Clothing, Laundry, Medical)',
            ],
        ];
    }
}

