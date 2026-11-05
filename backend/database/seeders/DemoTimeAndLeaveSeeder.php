<?php

namespace Database\Seeders;

use App\Http\Controllers\Api\TimeAndLeaveController;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\OvertimeRequest;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoTimeAndLeaveSeeder extends Seeder
{
    public function run(): void
    {
        $leaveTypesData = [
            [
                'code' => 'SIL',
                'name' => 'Service Incentive Leave (Labor Code Art. 95)',
                'category' => 'statutory',
                'default_annual_days' => 5.00,
                'min_tenure_months' => 12,
                'is_paid' => true,
                'is_convertible_to_cash' => true,
                'carry_over_cap' => 0.00,
                'description' => 'Mandatory 5 days paid leave after 1 year of service; unused credits convertible to cash at year-end.',
            ],
            [
                'code' => 'VL',
                'name' => 'Company Vacation Leave',
                'category' => 'company',
                'default_annual_days' => 15.00,
                'min_tenure_months' => 6,
                'is_paid' => true,
                'is_convertible_to_cash' => true,
                'carry_over_cap' => 5.00,
                'description' => 'Configurable company-granted paid vacation leave upon regularization (6 months).',
            ],
            [
                'code' => 'SL',
                'name' => 'Company Sick Leave',
                'category' => 'company',
                'default_annual_days' => 15.00,
                'min_tenure_months' => 6,
                'is_paid' => true,
                'is_convertible_to_cash' => false,
                'carry_over_cap' => 5.00,
                'description' => 'Configurable company-granted paid medical and recovery leave.',
            ],
            [
                'code' => 'MAT',
                'name' => 'Expanded Maternity Leave (RA 11210)',
                'category' => 'statutory',
                'default_annual_days' => 105.00,
                'min_tenure_months' => 0,
                'is_paid' => true,
                'is_convertible_to_cash' => false,
                'carry_over_cap' => 0.00,
                'description' => '105 days paid maternity leave (+15 days for solo parents under RA 8972).',
            ],
            [
                'code' => 'PAT',
                'name' => 'Paternity Leave (RA 8187)',
                'category' => 'statutory',
                'default_annual_days' => 7.00,
                'min_tenure_months' => 0,
                'is_paid' => true,
                'is_convertible_to_cash' => false,
                'carry_over_cap' => 0.00,
                'description' => '7 days paid leave for married male employees for the first 4 deliveries.',
            ],
            [
                'code' => 'SOLO',
                'name' => 'Solo Parent Leave (RA 8972)',
                'category' => 'statutory',
                'default_annual_days' => 7.00,
                'min_tenure_months' => 12,
                'is_paid' => true,
                'is_convertible_to_cash' => false,
                'carry_over_cap' => 0.00,
                'description' => '7 days paid parental leave per year for qualified solo parents.',
            ],
            [
                'code' => 'LWOP',
                'name' => 'Leave Without Pay (Unpaid)',
                'category' => 'company',
                'default_annual_days' => 30.00,
                'min_tenure_months' => 0,
                'is_paid' => false,
                'is_convertible_to_cash' => false,
                'carry_over_cap' => 0.00,
                'description' => 'Authorized unpaid absence; automatically deducted from semi-monthly basic pay.',
            ],
        ];

        $leaveTypes = [];
        foreach ($leaveTypesData as $lt) {
            $leaveTypes[$lt['code']] = LeaveType::updateOrCreate(
                ['code' => $lt['code']],
                $lt
            );
        }

        $employees = Employee::orderBy('id')->get();
        $hrReviewer = User::where('email', 'hr@payflow.ph')->first();

        // Seed 2026 Leave Balances for all employees (SIL, VL, SL)
        foreach ($employees as $emp) {
            foreach (['SIL', 'VL', 'SL'] as $code) {
                $lt = $leaveTypes[$code];
                LeaveBalance::updateOrCreate(
                    [
                        'employee_id' => $emp->id,
                        'leave_type_id' => $lt->id,
                        'year' => 2026,
                    ],
                    [
                        'entitled_days' => $lt->default_annual_days,
                        'used_days' => $code === 'VL' ? 2.00 : ($code === 'SL' ? 1.00 : 0.00),
                        'pending_days' => 0.00,
                    ]
                );
            }
        }

        // Seed realistic DTR logs across October 16-30, 2026 and Nov 1-2, 2026
        $sampleDtrEntries = [
            // Juan Dela Cruz (EMP-2026-001)
            ['code' => 'EMP-2026-001', 'date' => '2026-10-26', 'in' => '08:55', 'out' => '18:05', 'remarks' => 'Regular shift on time'],
            ['code' => 'EMP-2026-001', 'date' => '2026-10-27', 'in' => '09:18', 'out' => '18:02', 'remarks' => 'Traffic along EDSA (18m late)'],
            ['code' => 'EMP-2026-001', 'date' => '2026-10-28', 'in' => '09:00', 'out' => '17:30', 'remarks' => 'Early out for dental appointment (30m undertime)'],
            ['code' => 'EMP-2026-001', 'date' => '2026-10-29', 'in' => '08:52', 'out' => '21:00', 'remarks' => 'Production release deployment (+3h OT)'],
            ['code' => 'EMP-2026-001', 'date' => '2026-10-30', 'in' => '14:00', 'out' => '01:00', 'remarks' => 'Mid-to-night shift migration (includes 3h Night Diff)'],
            ['code' => 'EMP-2026-001', 'date' => '2026-11-01', 'in' => '09:00', 'out' => '18:00', 'remarks' => 'All Saints Day duty (Special Non-Working on Rest Day)'],

            // Maria Clara Santos (EMP-2026-005)
            ['code' => 'EMP-2026-005', 'date' => '2026-10-26', 'in' => '08:50', 'out' => '18:00', 'remarks' => 'Regular shift'],
            ['code' => 'EMP-2026-005', 'date' => '2026-10-27', 'in' => '08:58', 'out' => '18:10', 'remarks' => 'Regular shift'],
            ['code' => 'EMP-2026-005', 'date' => '2026-10-28', 'in' => '09:32', 'out' => '18:00', 'remarks' => 'MRT delay (32m late)'],
            ['code' => 'EMP-2026-005', 'date' => '2026-10-29', 'in' => '15:00', 'out' => '02:00', 'remarks' => 'Cloud cluster maintenance (4h Night Diff)'],

            // Gabriela Tolentino (EMP-2026-006)
            ['code' => 'EMP-2026-006', 'date' => '2026-10-26', 'in' => '09:00', 'out' => '18:00', 'remarks' => 'Design sprint review'],
            ['code' => 'EMP-2026-006', 'date' => '2026-10-27', 'in' => '08:54', 'out' => '18:04', 'remarks' => 'Regular shift'],

            // Camille Mercado (EMP-2026-008)
            ['code' => 'EMP-2026-008', 'date' => '2026-10-26', 'in' => '09:12', 'out' => '18:00', 'remarks' => '12m late'],
            ['code' => 'EMP-2026-008', 'date' => '2026-10-27', 'in' => '08:55', 'out' => '20:00', 'remarks' => 'Q4 Enterprise pitch deck prep'],

            // Rafael Pascual (EMP-2026-007)
            ['code' => 'EMP-2026-007', 'date' => '2026-10-26', 'in' => '08:59', 'out' => '18:00', 'remarks' => 'QA regression cycle'],
            ['code' => 'EMP-2026-007', 'date' => '2026-11-30', 'in' => '09:00', 'out' => '18:00', 'remarks' => 'Bonifacio Day Regular Holiday support'],
        ];

        foreach ($sampleDtrEntries as $entry) {
            $emp = $employees->firstWhere('employee_code', $entry['code']);
            if (! $emp) {
                continue;
            }
            $metrics = TimeAndLeaveController::computeDtrMetrics(
                $entry['date'],
                $entry['in'],
                $entry['out'],
                $emp->work_schedule_start ?? '09:00',
                $emp->work_schedule_end ?? '18:00'
            );

            Attendance::updateOrCreate(
                [
                    'employee_id' => $emp->id,
                    'work_date' => $entry['date'],
                ],
                array_merge($metrics, [
                    'time_in' => $entry['in'],
                    'time_out' => $entry['out'],
                    'remarks' => $entry['remarks'],
                ])
            );
        }

        // Seed DOLE Overtime Requests across different day classifications
        $overtimeSamples = [
            [
                'code' => 'EMP-2026-001',
                'work_date' => '2026-10-29',
                'day_type' => 'ordinary',
                'hours_requested' => 3.00,
                'night_diff_hours' => 0.00,
                'reason' => 'Production release deployment and hotfix verification',
                'status' => 'approved',
                'review_remarks' => 'Approved by HR & Engineering Lead',
            ],
            [
                'code' => 'EMP-2026-005',
                'work_date' => '2026-10-29',
                'day_type' => 'ordinary',
                'hours_requested' => 2.00,
                'night_diff_hours' => 2.00,
                'reason' => 'Zero-downtime database migration during midnight window',
                'status' => 'approved',
                'review_remarks' => 'Approved with 2h Night Shift Differential (+10%)',
            ],
            [
                'code' => 'EMP-2026-001',
                'work_date' => '2026-11-01',
                'day_type' => 'special_rest_day',
                'hours_requested' => 4.00,
                'night_diff_hours' => 0.00,
                'reason' => 'All Saints Day emergency payroll hotfix on Sunday Rest Day (1.95x)',
                'status' => 'approved',
                'review_remarks' => 'Verified Special Non-Working on Rest Day (195% DOLE rate)',
            ],
            [
                'code' => 'EMP-2026-007',
                'work_date' => '2026-11-30',
                'day_type' => 'regular_holiday',
                'hours_requested' => 3.00,
                'night_diff_hours' => 0.00,
                'reason' => 'Bonifacio Day (Regular Holiday) critical QA smoke testing (2.60x)',
                'status' => 'pending',
                'review_remarks' => null,
            ],
            [
                'code' => 'EMP-2026-008',
                'work_date' => '2026-10-27',
                'day_type' => 'ordinary',
                'hours_requested' => 2.00,
                'night_diff_hours' => 0.00,
                'reason' => 'Enterprise RFP proposal finalization',
                'status' => 'pending',
                'review_remarks' => null,
            ],
        ];

        foreach ($overtimeSamples as $ot) {
            $emp = $employees->firstWhere('employee_code', $ot['code']);
            if (! $emp) {
                continue;
            }
            OvertimeRequest::updateOrCreate(
                [
                    'employee_id' => $emp->id,
                    'work_date' => $ot['work_date'],
                    'day_type' => $ot['day_type'],
                ],
                [
                    'dole_multiplier' => OvertimeRequest::doleMultiplierFor($ot['day_type']),
                    'hours_requested' => $ot['hours_requested'],
                    'night_diff_hours' => $ot['night_diff_hours'],
                    'reason' => $ot['reason'],
                    'status' => $ot['status'],
                    'reviewed_by' => $ot['status'] === 'approved' ? $hrReviewer?->id : null,
                    'reviewed_at' => $ot['status'] === 'approved' ? now() : null,
                    'review_remarks' => $ot['review_remarks'],
                ]
            );
        }

        // Seed Leave Requests (Paid VL, Paid SL, Pending SIL, Unpaid LWOP)
        $leaveSamples = [
            [
                'code' => 'EMP-2026-001',
                'leave_code' => 'VL',
                'start_date' => '2026-11-12',
                'end_date' => '2026-11-13',
                'total_days' => 2.00,
                'reason' => 'Family trip to Baguio',
                'status' => 'pending',
                'review_remarks' => null,
            ],
            [
                'code' => 'EMP-2026-006',
                'leave_code' => 'SL',
                'start_date' => '2026-10-22',
                'end_date' => '2026-10-22',
                'total_days' => 1.00,
                'reason' => 'Acute migraine and medical consultation',
                'status' => 'approved',
                'review_remarks' => 'Medical certificate verified by HR',
            ],
            [
                'code' => 'EMP-2026-007',
                'leave_code' => 'LWOP',
                'start_date' => '2026-10-23',
                'end_date' => '2026-10-23',
                'total_days' => 1.00,
                'reason' => 'Probationary employee personal errand (Unpaid Leave)',
                'status' => 'approved',
                'review_remarks' => 'Approved as LWOP (deductible in Oct 16-31 cutoff)',
            ],
            [
                'code' => 'EMP-2026-005',
                'leave_code' => 'SIL',
                'start_date' => '2026-12-21',
                'end_date' => '2026-12-23',
                'total_days' => 3.00,
                'reason' => 'Year-end statutory Service Incentive Leave',
                'status' => 'pending',
                'review_remarks' => null,
            ],
        ];

        foreach ($leaveSamples as $lrData) {
            $emp = $employees->firstWhere('employee_code', $lrData['code']);
            $lt = $leaveTypes[$lrData['leave_code']] ?? null;
            if (! $emp || ! $lt) {
                continue;
            }

            LeaveRequest::updateOrCreate(
                [
                    'employee_id' => $emp->id,
                    'leave_type_id' => $lt->id,
                    'start_date' => $lrData['start_date'],
                ],
                [
                    'end_date' => $lrData['end_date'],
                    'total_days' => $lrData['total_days'],
                    'is_paid' => $lt->is_paid,
                    'reason' => $lrData['reason'],
                    'status' => $lrData['status'],
                    'reviewed_by' => $lrData['status'] === 'approved' ? $hrReviewer?->id : null,
                    'reviewed_at' => $lrData['status'] === 'approved' ? now() : null,
                    'review_remarks' => $lrData['review_remarks'],
                ]
            );

            if ($lrData['status'] === 'pending') {
                $balance = LeaveBalance::where('employee_id', $emp->id)
                    ->where('leave_type_id', $lt->id)
                    ->where('year', 2026)
                    ->first();
                if ($balance) {
                    $balance->update(['pending_days' => $lrData['total_days']]);
                }
            }
        }
    }
}
