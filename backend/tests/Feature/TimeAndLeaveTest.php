<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\LeaveBalance;
use App\Models\LeaveType;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimeAndLeaveTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_dtr_recording_computes_late_undertime_and_night_diff_and_holiday_classification(): void
    {
        $hrUser = User::where('email', 'hr@payflow.ph')->firstOrFail();
        $employee = Employee::where('employee_code', 'EMP-2026-001')->firstOrFail();

        // Ordinary workday with 15m late, 30m undertime
        $res1 = $this->actingAs($hrUser)->postJson('/api/attendances', [
            'employee_id' => $employee->id,
            'work_date' => '2026-10-20',
            'time_in' => '09:15',
            'time_out' => '17:30',
            'remarks' => 'Late and undertime test',
        ]);

        $res1->assertCreated()
            ->assertJsonPath('attendance.day_type', 'ordinary')
            ->assertJsonPath('attendance.late_minutes', 15)
            ->assertJsonPath('attendance.undertime_minutes', 30)
            ->assertJsonPath('attendance.status', 'late');

        // Night shift spanning 22:00 to 02:00 (4h NSD) on Regular Holiday (2026-12-25 Christmas Day)
        $res2 = $this->actingAs($hrUser)->postJson('/api/attendances', [
            'employee_id' => $employee->id,
            'work_date' => '2026-12-25',
            'time_in' => '17:00',
            'time_out' => '02:00',
            'remarks' => 'Christmas shift with night differential',
        ]);

        $res2->assertCreated()
            ->assertJsonPath('attendance.day_type', 'regular_holiday');

        $this->assertEquals(4.0, (float) $res2->json('attendance.night_diff_hours'));
    }

    public function test_dole_overtime_multiplier_matrix_and_approval(): void
    {
        $hrUser = User::where('email', 'hr@payflow.ph')->firstOrFail();
        $employee = Employee::where('employee_code', 'EMP-2026-001')->firstOrFail();

        $cases = [
            'ordinary' => 1.25,
            'rest_day' => 1.69,
            'special_non_working' => 1.69,
            'special_rest_day' => 1.95,
            'regular_holiday' => 2.60,
            'regular_holiday_rest_day' => 3.38,
        ];

        foreach ($cases as $dayType => $expectedMultiplier) {
            $response = $this->actingAs($hrUser)->postJson('/api/overtime-requests', [
                'employee_id' => $employee->id,
                'work_date' => '2026-11-15',
                'day_type' => $dayType,
                'hours_requested' => 2.5,
                'night_diff_hours' => 1.0,
                'reason' => "Testing {$dayType}",
            ]);

            $response->assertCreated();
            $this->assertEquals($expectedMultiplier, (float) $response->json('overtime_request.dole_multiplier'));
        }

        $otId = $response->json('overtime_request.id');
        $review = $this->actingAs($hrUser)->patchJson("/api/overtime-requests/{$otId}/review", [
            'status' => 'approved',
            'review_remarks' => 'Verified DOLE 338% rate',
        ]);

        $review->assertOk()
            ->assertJsonPath('overtime_request.status', 'approved');
    }

    public function test_leave_filing_updates_balances_and_hr_can_configure_leave_policy(): void
    {
        $hrUser = User::where('email', 'hr@payflow.ph')->firstOrFail();
        $employee = Employee::where('employee_code', 'EMP-2026-006')->firstOrFail();
        $vlType = LeaveType::where('code', 'VL')->firstOrFail();

        $beforeBalance = LeaveBalance::where('employee_id', $employee->id)
            ->where('leave_type_id', $vlType->id)
            ->where('year', 2026)
            ->firstOrFail();

        $initialUsed = (float) $beforeBalance->used_days;

        // File 3-day leave
        $fileRes = $this->actingAs($hrUser)->postJson('/api/leave-requests', [
            'employee_id' => $employee->id,
            'leave_type_id' => $vlType->id,
            'start_date' => '2026-11-18',
            'end_date' => '2026-11-20',
            'reason' => 'Annual vacation',
        ]);

        $fileRes->assertCreated()
            ->assertJsonPath('leave_request.status', 'pending');

        $leaveId = $fileRes->json('leave_request.id');

        $pendingBalance = $beforeBalance->fresh();
        $this->assertEquals(3.0, (float) $pendingBalance->pending_days);

        // Approve leave
        $approveRes = $this->actingAs($hrUser)->patchJson("/api/leave-requests/{$leaveId}/review", [
            'status' => 'approved',
            'review_remarks' => 'Enjoy your vacation!',
        ]);

        $approveRes->assertOk()
            ->assertJsonPath('leave_request.status', 'approved');

        $afterBalance = $beforeBalance->fresh();
        $this->assertEquals(0.0, (float) $afterBalance->pending_days);
        $this->assertEquals($initialUsed + 3.0, (float) $afterBalance->used_days);

        // Configure company VL policy
        $policyRes = $this->actingAs($hrUser)->putJson("/api/leave-types/{$vlType->id}", [
            'default_annual_days' => 18,
            'min_tenure_months' => 6,
            'carry_over_cap' => 7,
            'is_paid' => true,
            'is_convertible_to_cash' => true,
        ]);

        $policyRes->assertOk();
        $this->assertEquals(18.0, (float) $policyRes->json('leave_type.default_annual_days'));
    }
}
