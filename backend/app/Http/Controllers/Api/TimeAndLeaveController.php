<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Holiday;
use App\Models\LeaveBalance;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\OvertimeRequest;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TimeAndLeaveController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $employeeId = $request->integer('employee_id');

        $attendanceQuery = Attendance::with('employee:id,employee_code,first_name,last_name,department_id')
            ->orderByDesc('work_date')
            ->orderBy('employee_id');

        $leaveQuery = LeaveRequest::with([
            'employee:id,employee_code,first_name,last_name',
            'leaveType:id,code,name,category,is_paid',
            'reviewer:id,name',
        ])->latest();

        $overtimeQuery = OvertimeRequest::with([
            'employee:id,employee_code,first_name,last_name,basic_salary',
            'reviewer:id,name',
        ])->orderByDesc('work_date');

        if ($employeeId) {
            $attendanceQuery->where('employee_id', $employeeId);
            $leaveQuery->where('employee_id', $employeeId);
            $overtimeQuery->where('employee_id', $employeeId);
        }

        $attendances = $attendanceQuery->limit(80)->get();
        $leaveRequests = $leaveQuery->limit(50)->get();
        $overtimeRequests = $overtimeQuery->limit(50)->get()->map(function (OvertimeRequest $ot) {
            $hourlyRate = round(((float) ($ot->employee?->basic_salary ?? 0) * 12 / 261) / 8, 2);
            $otPay = round($hourlyRate * (float) $ot->dole_multiplier * (float) $ot->hours_requested, 2);
            $nsdPay = round($hourlyRate * (float) $ot->dole_multiplier * 0.10 * (float) $ot->night_diff_hours, 2);

            return [
                'id' => $ot->id,
                'employee_id' => $ot->employee_id,
                'employee' => $ot->employee,
                'work_date' => $ot->work_date?->format('Y-m-d'),
                'day_type' => $ot->day_type,
                'dole_multiplier' => (float) $ot->dole_multiplier,
                'hours_requested' => (float) $ot->hours_requested,
                'night_diff_hours' => (float) $ot->night_diff_hours,
                'hourly_rate' => $hourlyRate,
                'estimated_pay' => round($otPay + $nsdPay, 2),
                'reason' => $ot->reason,
                'status' => $ot->status,
                'reviewer_name' => $ot->reviewer?->name,
                'review_remarks' => $ot->review_remarks,
            ];
        });

        $leaveTypes = LeaveType::orderBy('category')->orderBy('code')->get();

        $balances = LeaveBalance::with(['employee:id,employee_code,first_name,last_name', 'leaveType:id,code,name,category,is_paid'])
            ->where('year', 2026)
            ->when($employeeId, fn ($q) => $q->where('employee_id', $employeeId))
            ->get()
            ->map(fn (LeaveBalance $b) => [
                'id' => $b->id,
                'employee_id' => $b->employee_id,
                'employee_code' => $b->employee?->employee_code,
                'employee_name' => $b->employee?->full_name,
                'leave_code' => $b->leaveType?->code,
                'leave_name' => $b->leaveType?->name,
                'category' => $b->leaveType?->category,
                'entitled_days' => (float) $b->entitled_days,
                'used_days' => (float) $b->used_days,
                'pending_days' => (float) $b->pending_days,
                'remaining_days' => $b->remaining_days,
            ]);

        $employees = Employee::select('id', 'employee_code', 'first_name', 'last_name', 'work_schedule_start', 'work_schedule_end')
            ->orderBy('employee_code')
            ->get()
            ->map(fn (Employee $e) => [
                'id' => $e->id,
                'employee_code' => $e->employee_code,
                'full_name' => $e->full_name,
                'schedule' => ($e->work_schedule_start ?? '09:00').' - '.($e->work_schedule_end ?? '18:00'),
            ]);

        return response()->json([
            'employees' => $employees,
            'attendances' => $attendances->map(fn (Attendance $a) => [
                'id' => $a->id,
                'employee_id' => $a->employee_id,
                'employee_code' => $a->employee?->employee_code,
                'employee_name' => $a->employee?->full_name,
                'work_date' => $a->work_date?->format('Y-m-d'),
                'day_type' => $a->day_type,
                'time_in' => $a->time_in,
                'time_out' => $a->time_out,
                'worked_hours' => (float) $a->worked_hours,
                'late_minutes' => $a->late_minutes,
                'undertime_minutes' => $a->undertime_minutes,
                'night_diff_hours' => (float) $a->night_diff_hours,
                'status' => $a->status,
                'remarks' => $a->remarks,
            ]),
            'leave_types' => $leaveTypes,
            'leave_balances' => $balances,
            'leave_requests' => $leaveRequests->map(fn (LeaveRequest $lr) => [
                'id' => $lr->id,
                'employee_id' => $lr->employee_id,
                'employee_code' => $lr->employee?->employee_code,
                'employee_name' => $lr->employee?->full_name,
                'leave_code' => $lr->leaveType?->code,
                'leave_name' => $lr->leaveType?->name,
                'category' => $lr->leaveType?->category,
                'start_date' => $lr->start_date?->format('Y-m-d'),
                'end_date' => $lr->end_date?->format('Y-m-d'),
                'total_days' => (float) $lr->total_days,
                'is_paid' => $lr->is_paid,
                'reason' => $lr->reason,
                'status' => $lr->status,
                'reviewer_name' => $lr->reviewer?->name,
                'review_remarks' => $lr->review_remarks,
            ]),
            'overtime_requests' => $overtimeRequests,
            'dole_matrix' => [
                ['day_type' => 'ordinary', 'label' => 'Ordinary Workday', 'multiplier' => 1.25, 'percentage' => '125%'],
                ['day_type' => 'rest_day', 'label' => 'Rest Day', 'multiplier' => 1.69, 'percentage' => '169% (130% × 130%)'],
                ['day_type' => 'special_non_working', 'label' => 'Special Non-Working Day', 'multiplier' => 1.69, 'percentage' => '169% (130% × 130%)'],
                ['day_type' => 'special_rest_day', 'label' => 'Special Day on Rest Day', 'multiplier' => 1.95, 'percentage' => '195% (150% × 130%)'],
                ['day_type' => 'regular_holiday', 'label' => 'Regular Holiday', 'multiplier' => 2.60, 'percentage' => '260% (200% × 130%)'],
                ['day_type' => 'regular_holiday_rest_day', 'label' => 'Regular Holiday on Rest Day', 'multiplier' => 3.38, 'percentage' => '338% (260% × 130%)'],
            ],
            'summary' => [
                'dtr_count' => $attendances->count(),
                'pending_leaves' => $leaveRequests->where('status', 'pending')->count(),
                'pending_overtime' => $overtimeRequests->where('status', 'pending')->count(),
                'total_late_minutes' => $attendances->sum('late_minutes'),
            ],
        ]);
    }

    public function recordAttendance(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => ['required', 'exists:employees,id'],
            'work_date' => ['required', 'date'],
            'time_in' => ['required', 'date_format:H:i'],
            'time_out' => ['required', 'date_format:H:i'],
            'remarks' => ['nullable', 'string', 'max:255'],
        ]);

        $employee = Employee::findOrFail($validated['employee_id']);
        $metrics = self::computeDtrMetrics(
            $validated['work_date'],
            $validated['time_in'],
            $validated['time_out'],
            $employee->work_schedule_start ?? '09:00',
            $employee->work_schedule_end ?? '18:00'
        );

        $attendance = Attendance::updateOrCreate(
            [
                'employee_id' => $employee->id,
                'work_date' => $validated['work_date'],
            ],
            array_merge($metrics, [
                'time_in' => $validated['time_in'],
                'time_out' => $validated['time_out'],
                'remarks' => $validated['remarks'] ?? null,
            ])
        );

        return response()->json(['attendance' => $attendance], 201);
    }

    public static function computeDtrMetrics(
        string $workDate,
        string $timeIn,
        string $timeOut,
        string $schedStart = '09:00',
        string $schedEnd = '18:00'
    ): array {
        $holiday = Holiday::where('date', $workDate)->first();
        $carbonDate = Carbon::parse($workDate);
        $isWeekend = $carbonDate->isWeekend();

        if ($holiday && $holiday->type === 'regular') {
            $dayType = $isWeekend ? 'regular_holiday_rest_day' : 'regular_holiday';
        } elseif ($holiday && $holiday->type === 'special_non_working') {
            $dayType = $isWeekend ? 'special_rest_day' : 'special_non_working';
        } else {
            $dayType = $isWeekend ? 'rest_day' : 'ordinary';
        }

        $in = Carbon::parse("{$workDate} {$timeIn}");
        $out = Carbon::parse("{$workDate} {$timeOut}");
        if ($out->lessThanOrEqualTo($in)) {
            $out->addDay();
        }

        $expectedIn = Carbon::parse("{$workDate} {$schedStart}");
        $expectedOut = Carbon::parse("{$workDate} {$schedEnd}");

        $lateMinutes = $in->greaterThan($expectedIn) ? (int) $expectedIn->diffInMinutes($in) : 0;
        $undertimeMinutes = $out->lessThan($expectedOut) ? (int) $out->diffInMinutes($expectedOut) : 0;

        $rawMinutes = max(0, $in->diffInMinutes($out) - 60); // 1h lunch break
        $workedHours = round($rawMinutes / 60, 2);

        // Compute Night Shift Differential (10:00 PM to 6:00 AM)
        $nsdStart = Carbon::parse("{$workDate} 22:00");
        $nsdEnd = Carbon::parse("{$workDate} 06:00")->addDay();
        $overlapStart = $in->greaterThan($nsdStart) ? $in : $nsdStart;
        $overlapEnd = $out->lessThan($nsdEnd) ? $out : $nsdEnd;
        $nsdMinutes = $overlapEnd->greaterThan($overlapStart) ? $overlapStart->diffInMinutes($overlapEnd) : 0;
        $nightDiffHours = round($nsdMinutes / 60, 2);

        return [
            'day_type' => $dayType,
            'worked_hours' => $workedHours,
            'late_minutes' => $lateMinutes,
            'undertime_minutes' => $undertimeMinutes,
            'night_diff_hours' => $nightDiffHours,
            'status' => $lateMinutes > 0 ? 'late' : 'present',
        ];
    }

    public function fileOvertime(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => ['required', 'exists:employees,id'],
            'work_date' => ['required', 'date'],
            'day_type' => ['required', 'in:ordinary,rest_day,special_non_working,special_rest_day,regular_holiday,regular_holiday_rest_day'],
            'hours_requested' => ['required', 'numeric', 'min:0.5', 'max:16'],
            'night_diff_hours' => ['nullable', 'numeric', 'min:0', 'max:8'],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $multiplier = OvertimeRequest::doleMultiplierFor($validated['day_type']);

        $ot = OvertimeRequest::create([
            'employee_id' => $validated['employee_id'],
            'work_date' => $validated['work_date'],
            'day_type' => $validated['day_type'],
            'dole_multiplier' => $multiplier,
            'hours_requested' => $validated['hours_requested'],
            'night_diff_hours' => $validated['night_diff_hours'] ?? 0,
            'reason' => $validated['reason'],
            'status' => 'pending',
        ]);

        return response()->json(['overtime_request' => $ot], 201);
    }

    public function reviewOvertime(Request $request, OvertimeRequest $overtimeRequest): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'review_remarks' => ['nullable', 'string', 'max:255'],
        ]);

        $overtimeRequest->update([
            'status' => $validated['status'],
            'reviewed_by' => $request->user()?->id,
            'reviewed_at' => now(),
            'review_remarks' => $validated['review_remarks'] ?? null,
        ]);

        activity('overtime')
            ->performedOn($overtimeRequest)
            ->causedBy($request->user())
            ->withProperties([
                'status' => $validated['status'],
                'dole_multiplier' => (float) $overtimeRequest->dole_multiplier,
                'hours' => (float) $overtimeRequest->hours_requested,
                'ip' => $request->ip(),
            ])
            ->event("overtime_{$validated['status']}")
            ->log(ucfirst($validated['status'])." overtime request #{$overtimeRequest->id}");

        return response()->json(['overtime_request' => $overtimeRequest]);
    }

    public function fileLeave(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_id' => ['required', 'exists:employees,id'],
            'leave_type_id' => ['required', 'exists:leave_types,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        $leaveType = LeaveType::findOrFail($validated['leave_type_id']);
        $days = Carbon::parse($validated['start_date'])->diffInDays(Carbon::parse($validated['end_date'])) + 1;

        $leaveRequest = DB::transaction(function () use ($validated, $leaveType, $days) {
            $lr = LeaveRequest::create([
                'employee_id' => $validated['employee_id'],
                'leave_type_id' => $leaveType->id,
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'total_days' => $days,
                'is_paid' => $leaveType->is_paid,
                'reason' => $validated['reason'],
                'status' => 'pending',
            ]);

            $balance = LeaveBalance::firstOrCreate(
                [
                    'employee_id' => $validated['employee_id'],
                    'leave_type_id' => $leaveType->id,
                    'year' => (int) substr($validated['start_date'], 0, 4),
                ],
                [
                    'entitled_days' => $leaveType->default_annual_days,
                    'used_days' => 0,
                    'pending_days' => 0,
                ]
            );

            $balance->increment('pending_days', $days);

            return $lr;
        });

        return response()->json(['leave_request' => $leaveRequest], 201);
    }

    public function reviewLeave(Request $request, LeaveRequest $leaveRequest): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'review_remarks' => ['nullable', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($leaveRequest, $validated, $request) {
            $previousStatus = $leaveRequest->status;
            $leaveRequest->update([
                'status' => $validated['status'],
                'reviewed_by' => $request->user()?->id,
                'reviewed_at' => now(),
                'review_remarks' => $validated['review_remarks'] ?? null,
            ]);

            if ($previousStatus === 'pending') {
                $balance = LeaveBalance::where('employee_id', $leaveRequest->employee_id)
                    ->where('leave_type_id', $leaveRequest->leave_type_id)
                    ->where('year', (int) $leaveRequest->start_date->format('Y'))
                    ->first();

                if ($balance) {
                    $balance->decrement('pending_days', (float) $leaveRequest->total_days);
                    if ($validated['status'] === 'approved') {
                        $balance->increment('used_days', (float) $leaveRequest->total_days);
                    }
                }
            }

            activity('leaves')
                ->performedOn($leaveRequest)
                ->causedBy($request->user())
                ->withProperties([
                    'status' => $validated['status'],
                    'total_days' => (float) $leaveRequest->total_days,
                    'is_paid' => $leaveRequest->is_paid,
                    'ip' => $request->ip(),
                ])
                ->event("leave_{$validated['status']}")
                ->log(ucfirst($validated['status'])." leave request #{$leaveRequest->id}");
        });

        return response()->json(['leave_request' => $leaveRequest]);
    }

    public function updateLeavePolicy(Request $request, LeaveType $leaveType): JsonResponse
    {
        $validated = $request->validate([
            'default_annual_days' => ['required', 'numeric', 'min:0', 'max:120'],
            'min_tenure_months' => ['required', 'integer', 'min:0', 'max:60'],
            'carry_over_cap' => ['required', 'numeric', 'min:0', 'max:60'],
            'is_paid' => ['required', 'boolean'],
            'is_convertible_to_cash' => ['required', 'boolean'],
        ]);

        $leaveType->update($validated);

        return response()->json(['leave_type' => $leaveType]);
    }
}
