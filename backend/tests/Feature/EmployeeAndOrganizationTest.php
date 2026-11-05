<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class EmployeeAndOrganizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_government_ids_are_encrypted_at_rest_and_masked_in_api(): void
    {
        $employee = Employee::where('employee_code', 'EMP-2026-001')->firstOrFail();

        // Raw database value must be ciphertext, never plaintext '34-9012841-2'
        $rawRow = DB::table('employees')->where('id', $employee->id)->first();
        $this->assertNotEquals('34-9012841-2', $rawRow->sss_no);
        $this->assertEquals('34-9012841-2', $employee->sss_no);

        $hrUser = User::where('email', 'hr@payflow.ph')->firstOrFail();

        // Default API response masks government IDs
        $maskedResponse = $this->actingAs($hrUser, 'sanctum')
            ->getJson("/api/employees/{$employee->id}");

        $maskedResponse->assertOk()
            ->assertJsonPath('employee.sss_no', '34--****--2')
            ->assertJsonPath('employee.is_unmasked', false);

        // Authorized user with unmask=1 receives decrypted values
        $unmaskedResponse = $this->actingAs($hrUser, 'sanctum')
            ->getJson("/api/employees/{$employee->id}?unmask=1");

        $unmaskedResponse->assertOk()
            ->assertJsonPath('employee.sss_no', '34-9012841-2')
            ->assertJsonPath('employee.is_unmasked', true);
    }

    public function test_salary_revision_records_history_and_audit_trail(): void
    {
        $hrUser = User::where('email', 'hr@payflow.ph')->firstOrFail();
        $employee = Employee::where('employee_code', 'EMP-2026-001')->firstOrFail();

        $response = $this->actingAs($hrUser, 'sanctum')
            ->postJson("/api/employees/{$employee->id}/revise-salary", [
                'new_salary' => 64000.00,
                'effective_date' => '2026-11-15',
                'reason' => 'Senior Promotion Adjustment',
            ]);

        $response->assertOk()
            ->assertJsonPath('employee.basic_salary', 64000);

        $this->assertDatabaseHas('salary_histories', [
            'employee_id' => $employee->id,
            'previous_salary' => 58000.00,
            'new_salary' => 64000.00,
            'reason' => 'Senior Promotion Adjustment',
        ]);

        $this->assertDatabaseHas('activity_log', [
            'log_name' => 'compensation',
            'event' => 'salary_revised',
            'causer_id' => $hrUser->id,
        ]);
    }
}

