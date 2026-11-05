<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'employees.view',
            'employees.manage',
            'employees.view_sensitive',
            'attendance.view',
            'attendance.manage',
            'leaves.view',
            'leaves.approve',
            'overtime.view',
            'overtime.approve',
            'payroll.prepare',
            'payroll.compute',
            'payroll.approve',
            'payroll.release',
            'payslips.view_own',
            'payslips.view_all',
            'settings.manage',
            'audit.view',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $superAdmin = Role::findOrCreate('Super Admin', 'web');
        $hrManager = Role::findOrCreate('HR Manager', 'web');
        $payrollOfficer = Role::findOrCreate('Payroll Officer', 'web');
        $financeApprover = Role::findOrCreate('Approver / Finance', 'web');
        $employeeRole = Role::findOrCreate('Employee', 'web');

        $superAdmin->syncPermissions($permissions);

        $hrManager->syncPermissions([
            'employees.view',
            'employees.manage',
            'employees.view_sensitive',
            'attendance.view',
            'attendance.manage',
            'leaves.view',
            'leaves.approve',
            'overtime.view',
            'overtime.approve',
            'payslips.view_own',
            'audit.view',
        ]);

        $payrollOfficer->syncPermissions([
            'employees.view',
            'employees.view_sensitive',
            'attendance.view',
            'leaves.view',
            'overtime.view',
            'payroll.prepare',
            'payroll.compute',
            'payslips.view_all',
            'payslips.view_own',
        ]);

        $financeApprover->syncPermissions([
            'employees.view',
            'payroll.approve',
            'payroll.release',
            'payslips.view_all',
            'payslips.view_own',
            'audit.view',
        ]);

        $employeeRole->syncPermissions([
            'payslips.view_own',
        ]);

        $demoUsers = [
            [
                'name' => 'Elena Valencia',
                'email' => 'admin@payflow.ph',
                'job_title' => 'VP of People & Systems',
                'department_name' => 'Executive & IT',
                'role' => 'Super Admin',
            ],
            [
                'name' => 'Marco Villanueva',
                'email' => 'hr@payflow.ph',
                'job_title' => 'HR Operations Manager',
                'department_name' => 'Human Resources',
                'role' => 'HR Manager',
            ],
            [
                'name' => 'Patricia Reyes',
                'email' => 'payroll@payflow.ph',
                'job_title' => 'Senior Payroll Specialist',
                'department_name' => 'Finance & Payroll',
                'role' => 'Payroll Officer',
            ],
            [
                'name' => 'Carlos Mendoza',
                'email' => 'finance@payflow.ph',
                'job_title' => 'Finance Controller',
                'department_name' => 'Finance & Payroll',
                'role' => 'Approver / Finance',
            ],
            [
                'name' => 'Juan Dela Cruz',
                'email' => 'employee@payflow.ph',
                'job_title' => 'Full-Stack Software Engineer',
                'department_name' => 'Engineering',
                'role' => 'Employee',
            ],
        ];

        foreach ($demoUsers as $data) {
            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'job_title' => $data['job_title'],
                    'department_name' => $data['department_name'],
                    'password' => Hash::make('password123'),
                    'email_verified_at' => now(),
                ]
            );
            $user->syncRoles([$data['role']]);
        }
    }
}
