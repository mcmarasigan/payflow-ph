<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\PayrollItem;
use App\Models\PayrollRun;
use App\Services\PhilippinePayrollCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PayrollController extends Controller
{
    public function index(): JsonResponse
    {
        $runs = PayrollRun::with([
            'preparer:id,name',
            'approver:id,name',
            'locker:id,name',
        ])
            ->orderByDesc('period_start')
            ->orderByDesc('id')
            ->get()
            ->map(fn (PayrollRun $r) => $this->formatRun($r));

        $employees = Employee::with('department:id,name')
            ->where('employment_status', 'active')
            ->orderBy('employee_code')
            ->get();

        $thirteenthMonthSchedule = $employees->map(
            fn (Employee $emp) => PhilippinePayrollCalculator::computeThirteenthMonth($emp, 2026)
        );

        return response()->json([
            'runs' => $runs,
            'thirteenth_month_schedule' => $thirteenthMonthSchedule,
            'statutory_summary' => [
                'sss' => '2025/2026 Schedule (RA 11199): 15% total (5% EE / 10% ER) on MSC ₱5,000–₱35,000 + ₱10/₱30 EC',
                'philhealth' => '2025/2026 Circular: 5.0% total (2.5% EE / 2.5% ER), Floor ₱10,000 – Ceiling ₱100,000',
                'pagibig' => '2024–2026 HDMF: 1% EE / 2% ER (≤ ₱1,500) or 2% EE / 2% ER (> ₱1,500), ₱10,000 MFS Cap (Max ₱200)',
                'train_tax' => 'BIR TRAIN Law (2023–2026): 0% up to ₱250k/yr (₱10,416.67 semi-monthly), progressive 15%–35%',
                'thirteenth_month' => 'PD 851 Mandatory 13th Month Pay (Total Basic Earned ÷ 12), Tax-Exempt up to ₱90,000 cap',
            ],
        ]);
    }

    public function show(PayrollRun $payrollRun): JsonResponse
    {
        $payrollRun->load([
            'preparer:id,name',
            'approver:id,name',
            'locker:id,name',
            'items',
        ]);

        return response()->json([
            'run' => $this->formatRun($payrollRun),
            'items' => $payrollRun->items,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'run_code' => ['required', 'string', 'max:30', 'unique:payroll_runs,run_code'],
            'name' => ['required', 'string', 'max:120'],
            'cutoff_type' => ['required', 'in:semi_monthly_1st,semi_monthly_2nd,monthly'],
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after_or_equal:period_start'],
            'pay_date' => ['required', 'date', 'after_or_equal:period_end'],
            'remarks' => ['nullable', 'string', 'max:255'],
        ]);

        $run = PayrollRun::create(array_merge($validated, [
            'status' => 'draft',
            'prepared_by' => $request->user()?->id,
        ]));

        activity('payroll')
            ->performedOn($run)
            ->causedBy($request->user())
            ->withProperties([
                'run_code' => $run->run_code,
                'status' => 'draft',
                'ip' => $request->ip(),
            ])
            ->event('payroll_created')
            ->log("Created draft payroll run {$run->run_code} ({$run->name})");

        return response()->json(['run' => $this->formatRun($run)], 201);
    }

    public function compute(Request $request, PayrollRun $payrollRun): JsonResponse
    {
        if ($payrollRun->isImmutable()) {
            return response()->json([
                'message' => "Payroll run {$payrollRun->run_code} is already {$payrollRun->status} and immutable. Adjustments must be made in a subsequent payroll period.",
            ], 422);
        }

        DB::transaction(function () use ($payrollRun, $request) {
            $employees = Employee::with(['department:id,name', 'position:id,title'])
                ->where('employment_status', 'active')
                ->orderBy('employee_code')
                ->get();

            $payrollRun->items()->delete();

            $totalGross = 0.0;
            $totalDeductions = 0.0;
            $totalNet = 0.0;
            $totalEmployer = 0.0;

            foreach ($employees as $emp) {
                $payload = PhilippinePayrollCalculator::computeForEmployee($emp, $payrollRun);
                PayrollItem::create(array_merge($payload, [
                    'payroll_run_id' => $payrollRun->id,
                ]));

                $totalGross += $payload['gross_pay'];
                $totalDeductions += $payload['total_deductions'];
                $totalNet += $payload['net_pay'];
                $totalEmployer += $payload['total_employer_cost'];
            }

            $payrollRun->update([
                'status' => 'computed',
                'headcount' => $employees->count(),
                'total_gross_pay' => round($totalGross, 2),
                'total_deductions' => round($totalDeductions, 2),
                'total_net_pay' => round($totalNet, 2),
                'total_employer_share' => round($totalEmployer, 2),
                'prepared_by' => $request->user()?->id ?? $payrollRun->prepared_by,
                'computed_at' => now(),
            ]);

            activity('payroll')
                ->performedOn($payrollRun)
                ->causedBy($request->user())
                ->withProperties([
                    'run_code' => $payrollRun->run_code,
                    'headcount' => $employees->count(),
                    'total_gross_pay' => round($totalGross, 2),
                    'total_net_pay' => round($totalNet, 2),
                    'ip' => $request->ip(),
                ])
                ->event('payroll_computed')
                ->log("Computed payroll run {$payrollRun->run_code} for {$employees->count()} employees (Net: ₱".number_format($totalNet, 2).')');
        });

        $payrollRun->refresh()->load(['preparer:id,name', 'approver:id,name', 'locker:id,name', 'items']);

        return response()->json([
            'run' => $this->formatRun($payrollRun),
            'items' => $payrollRun->items,
        ]);
    }

    public function approve(Request $request, PayrollRun $payrollRun): JsonResponse
    {
        if ($payrollRun->status !== 'computed') {
            return response()->json([
                'message' => "Only a 'computed' payroll run can be approved (current status: {$payrollRun->status}).",
            ], 422);
        }

        $payrollRun->update([
            'status' => 'approved',
            'approved_by' => $request->user()?->id,
            'approved_at' => now(),
            'remarks' => $request->input('remarks', $payrollRun->remarks),
        ]);

        activity('payroll')
            ->performedOn($payrollRun)
            ->causedBy($request->user())
            ->withProperties([
                'run_code' => $payrollRun->run_code,
                'previous_status' => 'computed',
                'new_status' => 'approved',
                'total_net_pay' => (float) $payrollRun->total_net_pay,
                'ip' => $request->ip(),
            ])
            ->event('payroll_approved')
            ->log("Approved payroll run {$payrollRun->run_code} — now immutable against recomputation");

        $payrollRun->load(['preparer:id,name', 'approver:id,name', 'locker:id,name', 'items']);

        return response()->json([
            'run' => $this->formatRun($payrollRun),
            'items' => $payrollRun->items,
        ]);
    }

    public function lock(Request $request, PayrollRun $payrollRun): JsonResponse
    {
        if ($payrollRun->status !== 'approved') {
            return response()->json([
                'message' => "Only an 'approved' payroll run can be locked and released (current status: {$payrollRun->status}).",
            ], 422);
        }

        $payrollRun->update([
            'status' => 'locked',
            'locked_by' => $request->user()?->id,
            'locked_at' => now(),
        ]);

        activity('payroll')
            ->performedOn($payrollRun)
            ->causedBy($request->user())
            ->withProperties([
                'run_code' => $payrollRun->run_code,
                'previous_status' => 'approved',
                'new_status' => 'locked',
                'total_net_pay' => (float) $payrollRun->total_net_pay,
                'ip' => $request->ip(),
            ])
            ->event('payroll_locked')
            ->log("Locked & released payslips for payroll run {$payrollRun->run_code}");

        $payrollRun->load(['preparer:id,name', 'approver:id,name', 'locker:id,name', 'items']);

        return response()->json([
            'run' => $this->formatRun($payrollRun),
            'items' => $payrollRun->items,
        ]);
    }

    public function simulate(Request $request): JsonResponse
    {
        $salary = max(1000.0, (float) $request->input('monthly_salary', 58000.0));

        $sss = PhilippinePayrollCalculator::computeSss($salary);
        $philhealth = PhilippinePayrollCalculator::computePhilHealth($salary);
        $pagibig = PhilippinePayrollCalculator::computePagIbig($salary);

        $monthlyTaxable = max(
            0.0,
            round($salary - ($sss['ee_monthly'] + $philhealth['ee_monthly'] + $pagibig['ee_monthly']), 2)
        );
        $semiMonthlyTaxable = round($monthlyTaxable / 2.0, 2);

        $monthlyTax = PhilippinePayrollCalculator::computeTrainWithholdingTax($monthlyTaxable, 'monthly');
        $semiMonthlyTax = PhilippinePayrollCalculator::computeTrainWithholdingTax($semiMonthlyTaxable, 'semi_monthly');

        return response()->json([
            'monthly_salary' => $salary,
            'sss' => $sss,
            'philhealth' => $philhealth,
            'pagibig' => $pagibig,
            'monthly_taxable_income' => $monthlyTaxable,
            'monthly_tax' => $monthlyTax,
            'semi_monthly_taxable_income' => $semiMonthlyTaxable,
            'semi_monthly_tax' => $semiMonthlyTax,
            'net_monthly_before_allowances' => round($monthlyTaxable - $monthlyTax['tax'], 2),
        ]);
    }

    private function formatRun(PayrollRun $r): array
    {
        return [
            'id' => $r->id,
            'run_code' => $r->run_code,
            'name' => $r->name,
            'cutoff_type' => $r->cutoff_type,
            'period_start' => $r->period_start?->format('Y-m-d'),
            'period_end' => $r->period_end?->format('Y-m-d'),
            'pay_date' => $r->pay_date?->format('Y-m-d'),
            'status' => $r->status,
            'is_immutable' => $r->isImmutable(),
            'headcount' => $r->headcount,
            'total_gross_pay' => (float) $r->total_gross_pay,
            'total_deductions' => (float) $r->total_deductions,
            'total_net_pay' => (float) $r->total_net_pay,
            'total_employer_share' => (float) $r->total_employer_share,
            'preparer_name' => $r->preparer?->name,
            'computed_at' => $r->computed_at?->format('Y-m-d H:i'),
            'approver_name' => $r->approver?->name,
            'approved_at' => $r->approved_at?->format('Y-m-d H:i'),
            'locker_name' => $r->locker?->name,
            'locked_at' => $r->locked_at?->format('Y-m-d H:i'),
            'remarks' => $r->remarks,
        ];
    }
}
