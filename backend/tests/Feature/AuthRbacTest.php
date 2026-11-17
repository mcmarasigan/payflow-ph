<?php

namespace Tests\Feature;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthRbacTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_demo_user_can_login_and_receive_role_permissions(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'admin@payflow.ph',
            'password' => 'password123',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'primary_role', 'permissions']])
            ->assertJsonPath('user.primary_role', 'Super Admin');
    }

    public function test_separation_of_duties_between_payroll_officer_and_finance_approver(): void
    {
        $officerLogin = $this->postJson('/api/auth/login', [
            'email' => 'payroll@payflow.ph',
            'password' => 'password123',
        ])->json('user');

        $this->assertContains('payroll.compute', $officerLogin['permissions']);
        $this->assertNotContains('payroll.approve', $officerLogin['permissions']);

        $financeLogin = $this->postJson('/api/auth/login', [
            'email' => 'finance@payflow.ph',
            'password' => 'password123',
        ])->json('user');

        $this->assertContains('payroll.approve', $financeLogin['permissions']);
        $this->assertNotContains('payroll.compute', $financeLogin['permissions']);
    }

    public function test_employee_role_is_blocked_from_admin_modules_and_scoped_to_own_records(): void
    {
        $employeeUser = \App\Models\User::where('email', 'employee@payflow.ph')->firstOrFail();

        // Admin / HR / Payroll modules are forbidden
        $this->actingAs($employeeUser)->getJson('/api/employees')->assertForbidden();
        $this->actingAs($employeeUser)->getJson('/api/organization')->assertForbidden();
        $this->actingAs($employeeUser)->getJson('/api/payroll/runs')->assertForbidden();
        $this->actingAs($employeeUser)->getJson('/api/executive/analytics')->assertForbidden();

        // Attendance is self-scoped: only their own employee record is returned
        $res = $this->actingAs($employeeUser)->getJson('/api/time-and-leave');
        $res->assertOk()
            ->assertJsonPath('is_self_service', true)
            ->assertJsonCount(1, 'employees')
            ->assertJsonPath('employees.0.employee_code', 'EMP-2026-001');

        // Cannot download another employee's payslip
        $other = \App\Models\PayrollItem::where('employee_code', '!=', 'EMP-2026-001')->firstOrFail();
        $this->actingAs($employeeUser)->get("/api/portal/payslips/{$other->id}/pdf")->assertForbidden();
    }
}

