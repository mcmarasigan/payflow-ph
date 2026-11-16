<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\PayrollItem;
use App\Models\PayrollRun;
use App\Models\User;
use App\Services\PhilippinePayrollCalculator;
use Illuminate\Database\Seeder;

class DemoPayrollSeeder extends Seeder
{
    public function run(): void
    {
        $payrollOfficer = User::where('email', 'payroll@payflow.ph')->first();
        $financeApprover = User::where('email', 'finance@payflow.ph')->first();
        $employees = Employee::with(['department:id,name', 'position:id,title'])
            ->where('employment_status', 'active')
            ->orderBy('employee_code')
            ->get();

        $runsConfig = [
            [
                'run_code' => 'PR-2026-10A',
                'name' => 'October 2026 — 1st Half Cutoff (Oct 1–15)',
                'cutoff_type' => 'semi_monthly_1st',
                'period_start' => '2026-10-01',
                'period_end' => '2026-10-15',
                'pay_date' => '2026-10-15',
                'target_status' => 'locked',
                'remarks' => 'Released & disbursed via BDO Corporate Payroll file',
            ],
            [
                'run_code' => 'PR-2026-10B',
                'name' => 'October 2026 — 2nd Half Cutoff (Oct 16–31)',
                'cutoff_type' => 'semi_monthly_2nd',
                'period_start' => '2026-10-16',
                'period_end' => '2026-10-31',
                'pay_date' => '2026-10-30',
                'target_status' => 'computed',
                'remarks' => 'Includes Oct 16–31 DTR lates, undertime, NSD, DOLE overtime, and LWOP deductions; awaiting Finance approval.',
            ],
        ];

        foreach ($runsConfig as $cfg) {
            $run = PayrollRun::updateOrCreate(
                ['run_code' => $cfg['run_code']],
                [
                    'name' => $cfg['name'],
                    'cutoff_type' => $cfg['cutoff_type'],
                    'period_start' => $cfg['period_start'],
                    'period_end' => $cfg['period_end'],
                    'pay_date' => $cfg['pay_date'],
                    'status' => 'draft',
                    'prepared_by' => $payrollOfficer?->id,
                    'remarks' => $cfg['remarks'],
                ]
            );

            $run->items()->delete();

            $totalGross = 0.0;
            $totalDeductions = 0.0;
            $totalNet = 0.0;
            $totalEmployer = 0.0;

            foreach ($employees as $emp) {
                $payload = PhilippinePayrollCalculator::computeForEmployee($emp, $run);
                PayrollItem::create(array_merge($payload, [
                    'payroll_run_id' => $run->id,
                ]));

                $totalGross += $payload['gross_pay'];
                $totalDeductions += $payload['total_deductions'];
                $totalNet += $payload['net_pay'];
                $totalEmployer += $payload['total_employer_cost'];
            }

            $isLocked = $cfg['target_status'] === 'locked';

            $run->update([
                'status' => $cfg['target_status'],
                'headcount' => $employees->count(),
                'total_gross_pay' => round($totalGross, 2),
                'total_deductions' => round($totalDeductions, 2),
                'total_net_pay' => round($totalNet, 2),
                'total_employer_share' => round($totalEmployer, 2),
                'computed_at' => now()->subDays($isLocked ? 16 : 1),
                'approved_by' => $isLocked ? $financeApprover?->id : null,
                'approved_at' => $isLocked ? now()->subDays(15) : null,
                'locked_by' => $isLocked ? $financeApprover?->id : null,
                'locked_at' => $isLocked ? now()->subDays(15) : null,
            ]);
        }
    }
}
