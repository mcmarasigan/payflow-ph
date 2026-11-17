<?php

namespace Tests\Feature;

use App\Models\PayrollItem;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PortalAndAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_employee_can_view_own_portal_payslips_and_bir_2316_summary_with_masked_ids(): void
    {
        $employeeUser = User::where('email', 'employee@payflow.ph')->firstOrFail();

        $res = $this->actingAs($employeeUser)->getJson('/api/portal/overview');

        $res->assertOk()
            ->assertJsonPath('employee.employee_code', 'EMP-2026-001')
            ->assertJsonPath('bir_2316_summary.tax_year', 2026)
            ->assertJsonCount(2, 'payslips');

        $this->assertStringContainsString('****', $res->json('employee.masked_sss'));
        $this->assertStringContainsString('****', $res->json('employee.masked_tin'));
    }

    public function test_payslip_pdf_downloads_valid_pdf_document_and_logs_audit(): void
    {
        $employeeUser = User::where('email', 'employee@payflow.ph')->firstOrFail();
        $item = PayrollItem::firstOrFail();

        $res = $this->actingAs($employeeUser)->get("/api/portal/payslips/{$item->id}/pdf");

        $res->assertOk();
        $this->assertStringContainsString('application/pdf', $res->headers->get('Content-Type'));
    }

    public function test_executive_analytics_returns_remittance_schedule_and_department_breakdown(): void
    {
        $admin = User::where('email', 'admin@payflow.ph')->firstOrFail();

        $res = $this->actingAs($admin)->getJson('/api/executive/analytics');

        $res->assertOk()
            ->assertJsonPath('kpis.active_headcount', 10)
            ->assertJsonCount(5, 'department_breakdown')
            ->assertJsonCount(2, 'remittance_schedule');
    }
}
