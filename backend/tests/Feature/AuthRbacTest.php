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
}

