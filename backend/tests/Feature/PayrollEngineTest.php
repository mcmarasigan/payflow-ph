<?php

namespace Tests\Feature;

use App\Models\PayrollRun;
use App\Models\User;
use App\Services\PhilippinePayrollCalculator;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PayrollEngineTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_2025_2026_philippine_statutory_formulas_are_exact(): void
    {
        // 1. SSS: Salary ₱58,000 -> capped at ₱35,000 MSC (₱20k Regular + ₱15k MPF)
        // EE = 5% of 35,000 = 1,750.00 | ER = 10% of 35,000 = 3,500.00 | EC = 30.00
        $sss = PhilippinePayrollCalculator::computeSss(58000.00);
        $this->assertEquals(35000.00, $sss['msc']);
        $this->assertEquals(20000.00, $sss['regular_msc']);
        $this->assertEquals(15000.00, $sss['mpf_msc']);
        $this->assertEquals(1750.00, $sss['ee_monthly']);
        $this->assertEquals(3500.00, $sss['er_monthly']);
        $this->assertEquals(30.00, $sss['ec_monthly']);

        // 2. PhilHealth: 5% split (2.5% EE / 2.5% ER), ₱10k floor, ₱100k ceiling
        $phMid = PhilippinePayrollCalculator::computePhilHealth(58000.00);
        $this->assertEquals(1450.00, $phMid['ee_monthly']);
        $this->assertEquals(1450.00, $phMid['er_monthly']);

        $phHigh = PhilippinePayrollCalculator::computePhilHealth(150000.00);
        $this->assertEquals(100000.00, $phHigh['salary_basis']);
        $this->assertEquals(2500.00, $phHigh['ee_monthly']);

        // 3. Pag-IBIG: Tier 1 (<= ₱1,500 -> 1% EE / 2% ER) vs Tier 2 (> ₱1,500 -> 2% EE / 2% ER, ₱10k MFS cap)
        $piLow = PhilippinePayrollCalculator::computePagIbig(1500.00);
        $this->assertEquals(0.01, $piLow['ee_rate']);
        $this->assertEquals(15.00, $piLow['ee_monthly']);
        $this->assertEquals(30.00, $piLow['er_monthly']);

        $piHigh = PhilippinePayrollCalculator::computePagIbig(58000.00);
        $this->assertEquals(10000.00, $piHigh['mfs_basis']);
        $this->assertEquals(200.00, $piHigh['ee_monthly']);
        $this->assertEquals(200.00, $piHigh['er_monthly']);

        // 4. BIR TRAIN Withholding Tax (Semi-Monthly)
        // Exempt <= 10,416.67
        $taxExempt = PhilippinePayrollCalculator::computeTrainWithholdingTax(10000.00, 'semi_monthly');
        $this->assertEquals(0.00, $taxExempt['tax']);

        // Bracket 3 (16,666.67 to 33,333.33 -> 937.50 + 20% excess over 16,666.67)
        $taxB3 = PhilippinePayrollCalculator::computeTrainWithholdingTax(26666.67, 'semi_monthly');
        $this->assertEquals(2937.50, $taxB3['tax']);
    }

    public function test_separation_of_duties_and_immutability_of_approved_payroll_runs(): void
    {
        $payrollOfficer = User::where('email', 'payroll@payflow.ph')->firstOrFail();
        $financeApprover = User::where('email', 'finance@payflow.ph')->firstOrFail();

        $run = PayrollRun::where('run_code', 'PR-2026-10B')->firstOrFail();
        $this->assertEquals('computed', $run->status);

        // Payroll Officer can recompute a 'computed' run
        $recomputeRes = $this->actingAs($payrollOfficer)
            ->postJson("/api/payroll/runs/{$run->id}/compute");
        $recomputeRes->assertOk()
            ->assertJsonPath('run.status', 'computed')
            ->assertJsonPath('run.headcount', 10);

        // Payroll Officer CANNOT approve the run (403 Forbidden)
        $forbiddenApprove = $this->actingAs($payrollOfficer)
            ->postJson("/api/payroll/runs/{$run->id}/approve");
        $forbiddenApprove->assertForbidden();

        // Finance Approver CANNOT compute the run (403 Forbidden)
        $forbiddenCompute = $this->actingAs($financeApprover)
            ->postJson("/api/payroll/runs/{$run->id}/compute");
        $forbiddenCompute->assertForbidden();

        // Finance Approver CAN approve the run
        $approveRes = $this->actingAs($financeApprover)
            ->postJson("/api/payroll/runs/{$run->id}/approve", [
                'remarks' => 'Verified statutory totals and BIR withholding tax.',
            ]);
        $approveRes->assertOk()
            ->assertJsonPath('run.status', 'approved')
            ->assertJsonPath('run.is_immutable', true);

        // Once approved, even Payroll Officer or Super Admin CANNOT recompute (422 Immutable)
        $immutableRes = $this->actingAs($payrollOfficer)
            ->postJson("/api/payroll/runs/{$run->id}/compute");
        $immutableRes->assertStatus(422);

        // Finance Approver CAN lock & release the approved run
        $lockRes = $this->actingAs($financeApprover)
            ->postJson("/api/payroll/runs/{$run->id}/lock");
        $lockRes->assertOk()
            ->assertJsonPath('run.status', 'locked');
    }
}

