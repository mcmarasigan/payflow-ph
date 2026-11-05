<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Employee;
use App\Models\Holiday;
use App\Models\Position;
use App\Models\SalaryHistory;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoOrganizationAndEmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $departmentsData = [
            ['code' => 'ENG', 'name' => 'Engineering & Product', 'description' => 'Full-stack software engineering, architecture, and platform operations'],
            ['code' => 'HR', 'name' => 'Human Resources & People', 'description' => 'Talent acquisition, employee relations, timekeeping, and compliance'],
            ['code' => 'FIN', 'name' => 'Finance & Payroll', 'description' => 'Statutory remittances, general ledger, treasury, and payroll authorization'],
            ['code' => 'OPS', 'name' => 'Client Operations & Support', 'description' => 'Enterprise onboarding, customer success, and service delivery'],
            ['code' => 'QA', 'name' => 'Quality Assurance & Security', 'description' => 'Automated testing, release verification, and compliance auditing'],
        ];

        $depts = [];
        foreach ($departmentsData as $d) {
            $depts[$d['code']] = Department::updateOrCreate(['code' => $d['code']], $d);
        }

        $positionsData = [
            ['dept' => 'ENG', 'title' => 'Lead Solutions Architect', 'level' => 'Lead'],
            ['dept' => 'ENG', 'title' => 'Full-Stack Software Engineer', 'level' => 'Senior'],
            ['dept' => 'ENG', 'title' => 'Frontend React Developer', 'level' => 'Mid-Level'],
            ['dept' => 'ENG', 'title' => 'Junior Backend Developer', 'level' => 'Junior'],
            ['dept' => 'HR', 'title' => 'HR Operations Manager', 'level' => 'Managerial'],
            ['dept' => 'HR', 'title' => 'People & Timekeeping Associate', 'level' => 'Junior'],
            ['dept' => 'FIN', 'title' => 'Finance Controller', 'level' => 'Managerial'],
            ['dept' => 'FIN', 'title' => 'Senior Payroll Specialist', 'level' => 'Senior'],
            ['dept' => 'OPS', 'title' => 'Client Success Specialist', 'level' => 'Mid-Level'],
            ['dept' => 'QA', 'title' => 'Software QA Engineer', 'level' => 'Mid-Level'],
        ];

        $positions = [];
        foreach ($positionsData as $p) {
            $positions[$p['title']] = Position::updateOrCreate(
                ['department_id' => $depts[$p['dept']]->id, 'title' => $p['title']],
                ['level' => $p['level'], 'is_active' => true]
            );
        }

        // 2026 Philippine Statutory Holidays (Regular vs Special Non-Working)
        $holidays2026 = [
            ['name' => "New Year's Day", 'date' => '2026-01-01', 'type' => 'regular'],
            ['name' => 'Chinese New Year', 'date' => '2026-02-17', 'type' => 'special_non_working'],
            ['name' => 'EDSA People Power Anniversary', 'date' => '2026-02-25', 'type' => 'special_non_working'],
            ['name' => 'Maundy Thursday', 'date' => '2026-04-02', 'type' => 'regular'],
            ['name' => 'Good Friday', 'date' => '2026-04-03', 'type' => 'regular'],
            ['name' => 'Black Saturday', 'date' => '2026-04-04', 'type' => 'special_non_working'],
            ['name' => 'Araw ng Kagitingan', 'date' => '2026-04-09', 'type' => 'regular'],
            ['name' => 'Labor Day', 'date' => '2026-05-01', 'type' => 'regular'],
            ['name' => 'Independence Day', 'date' => '2026-06-12', 'type' => 'regular'],
            ['name' => 'Ninoy Aquino Day', 'date' => '2026-08-21', 'type' => 'special_non_working'],
            ['name' => 'National Heroes Day', 'date' => '2026-08-31', 'type' => 'regular'],
            ['name' => "All Saints' Day", 'date' => '2026-11-01', 'type' => 'special_non_working'],
            ['name' => 'Bonifacio Day', 'date' => '2026-11-30', 'type' => 'regular'],
            ['name' => 'Feast of the Immaculate Conception', 'date' => '2026-12-08', 'type' => 'special_non_working'],
            ['name' => 'Christmas Day', 'date' => '2026-12-25', 'type' => 'regular'],
            ['name' => 'Rizal Day', 'date' => '2026-12-30', 'type' => 'regular'],
            ['name' => 'Last Day of the Year', 'date' => '2026-12-31', 'type' => 'special_non_working'],
        ];

        foreach ($holidays2026 as $h) {
            Holiday::updateOrCreate(
                ['date' => $h['date']],
                ['name' => $h['name'], 'type' => $h['type'], 'year' => 2026, 'is_recurring' => true]
            );
        }

        $adminUser = User::where('email', 'admin@payflow.ph')->first();

        // 100% Synthetic Fictional Filipino Employee Profiles
        $syntheticEmployees = [
            [
                'code' => 'EMP-2026-001',
                'first_name' => 'Juan',
                'middle_name' => 'Reyes',
                'last_name' => 'Dela Cruz',
                'email' => 'employee@payflow.ph',
                'phone' => '+63 917 555 0101',
                'birth_date' => '1997-04-15',
                'gender' => 'Male',
                'civil_status' => 'Single',
                'address' => 'Brgy. San Antonio, Pasig City, Metro Manila',
                'dept' => 'ENG',
                'pos' => 'Full-Stack Software Engineer',
                'type' => 'regular',
                'hire_date' => '2023-03-01',
                'regularization_date' => '2023-09-01',
                'basic_salary' => 58000.00,
                'prev_salary' => 48000.00,
                'sss' => '34-9012841-2',
                'philhealth' => '12-094817263-1',
                'pagibig' => '1210-4829-3910',
                'tin' => '312-849-102-000',
                'bank_acct' => '0049-1827-3912',
            ],
            [
                'code' => 'EMP-2026-002',
                'first_name' => 'Marco',
                'middle_name' => 'Santos',
                'last_name' => 'Villanueva',
                'email' => 'hr@payflow.ph',
                'phone' => '+63 917 555 0102',
                'birth_date' => '1992-08-22',
                'gender' => 'Male',
                'civil_status' => 'Married',
                'address' => 'BGC, Taguig City, Metro Manila',
                'dept' => 'HR',
                'pos' => 'HR Operations Manager',
                'type' => 'regular',
                'hire_date' => '2022-06-15',
                'regularization_date' => '2022-12-15',
                'basic_salary' => 65000.00,
                'prev_salary' => 55000.00,
                'sss' => '34-8172635-4',
                'philhealth' => '12-837465192-3',
                'pagibig' => '1210-9182-7364',
                'tin' => '298-716-543-000',
                'bank_acct' => '0049-9182-7361',
            ],
            [
                'code' => 'EMP-2026-003',
                'first_name' => 'Patricia',
                'middle_name' => 'Gomez',
                'last_name' => 'Reyes',
                'email' => 'payroll@payflow.ph',
                'phone' => '+63 917 555 0103',
                'birth_date' => '1994-11-10',
                'gender' => 'Female',
                'civil_status' => 'Single',
                'address' => 'Loyola Heights, Quezon City, Metro Manila',
                'dept' => 'FIN',
                'pos' => 'Senior Payroll Specialist',
                'type' => 'regular',
                'hire_date' => '2023-01-10',
                'regularization_date' => '2023-07-10',
                'basic_salary' => 48000.00,
                'prev_salary' => 42000.00,
                'sss' => '34-7162534-9',
                'philhealth' => '12-564738291-0',
                'pagibig' => '1210-5647-3829',
                'tin' => '412-398-765-000',
                'bank_acct' => '0049-5647-3820',
            ],
            [
                'code' => 'EMP-2026-004',
                'first_name' => 'Carlos',
                'middle_name' => 'Aquino',
                'last_name' => 'Mendoza',
                'email' => 'finance@payflow.ph',
                'phone' => '+63 917 555 0104',
                'birth_date' => '1989-02-19',
                'gender' => 'Male',
                'civil_status' => 'Married',
                'address' => 'Salcedo Village, Makati City, Metro Manila',
                'dept' => 'FIN',
                'pos' => 'Finance Controller',
                'type' => 'regular',
                'hire_date' => '2021-09-01',
                'regularization_date' => '2022-03-01',
                'basic_salary' => 88000.00,
                'prev_salary' => 78000.00,
                'sss' => '34-6152437-1',
                'philhealth' => '12-192837465-8',
                'pagibig' => '1210-1928-3746',
                'tin' => '198-273-645-000',
                'bank_acct' => '0049-1928-3749',
            ],
            [
                'code' => 'EMP-2026-005',
                'first_name' => 'Maria Clara',
                'middle_name' => 'Dizon',
                'last_name' => 'Santos',
                'email' => 'mariaclara.santos@payflow.ph',
                'phone' => '+63 917 555 0105',
                'birth_date' => '1996-07-04',
                'gender' => 'Female',
                'civil_status' => 'Single',
                'address' => 'Kapitolyo, Pasig City, Metro Manila',
                'dept' => 'ENG',
                'pos' => 'Lead Solutions Architect',
                'type' => 'regular',
                'hire_date' => '2022-02-01',
                'regularization_date' => '2022-08-01',
                'basic_salary' => 95000.00,
                'prev_salary' => 82000.00,
                'sss' => '34-5142368-7',
                'philhealth' => '12-918273645-4',
                'pagibig' => '1210-8273-6451',
                'tin' => '345-612-890-000',
                'bank_acct' => '0049-8273-6455',
            ],
            [
                'code' => 'EMP-2026-006',
                'first_name' => 'Gabriela',
                'middle_name' => 'Luna',
                'last_name' => 'Tolentino',
                'email' => 'gabriela.tolentino@payflow.ph',
                'phone' => '+63 917 555 0106',
                'birth_date' => '1999-12-12',
                'gender' => 'Female',
                'civil_status' => 'Single',
                'address' => 'Mandaluyong City, Metro Manila',
                'dept' => 'ENG',
                'pos' => 'Frontend React Developer',
                'type' => 'regular',
                'hire_date' => '2024-01-15',
                'regularization_date' => '2024-07-15',
                'basic_salary' => 42000.00,
                'prev_salary' => 36000.00,
                'sss' => '34-4132987-5',
                'philhealth' => '12-456123789-2',
                'pagibig' => '1210-4561-2378',
                'tin' => '456-123-789-000',
                'bank_acct' => '0049-4561-2370',
            ],
            [
                'code' => 'EMP-2026-007',
                'first_name' => 'Rafael',
                'middle_name' => 'Bautista',
                'last_name' => 'Pascual',
                'email' => 'rafael.pascual@payflow.ph',
                'phone' => '+63 917 555 0107',
                'birth_date' => '2001-05-28',
                'gender' => 'Male',
                'civil_status' => 'Single',
                'address' => 'Marikina Heights, Marikina City',
                'dept' => 'ENG',
                'pos' => 'Junior Backend Developer',
                'type' => 'probationary',
                'hire_date' => '2026-08-01',
                'regularization_date' => null,
                'basic_salary' => 28000.00,
                'prev_salary' => 28000.00,
                'sss' => '34-3129876-3',
                'philhealth' => '12-321654987-6',
                'pagibig' => '1210-3216-5498',
                'tin' => '512-345-678-000',
                'bank_acct' => '0049-3216-5491',
            ],
            [
                'code' => 'EMP-2026-008',
                'first_name' => 'Camille',
                'middle_name' => 'Soriano',
                'last_name' => 'Mercado',
                'email' => 'camille.mercado@payflow.ph',
                'phone' => '+63 917 555 0108',
                'birth_date' => '1998-09-09',
                'gender' => 'Female',
                'civil_status' => 'Single',
                'address' => 'Alabang, Muntinlupa City',
                'dept' => 'QA',
                'pos' => 'Software QA Engineer',
                'type' => 'regular',
                'hire_date' => '2024-04-01',
                'regularization_date' => '2024-10-01',
                'basic_salary' => 38000.00,
                'prev_salary' => 33000.00,
                'sss' => '34-2198765-8',
                'philhealth' => '12-789456123-9',
                'pagibig' => '1210-7894-5612',
                'tin' => '612-890-123-000',
                'bank_acct' => '0049-7894-5618',
            ],
            [
                'code' => 'EMP-2026-009',
                'first_name' => 'Lorenzo',
                'middle_name' => 'Castillo',
                'last_name' => 'Navarro',
                'email' => 'lorenzo.navarro@payflow.ph',
                'phone' => '+63 917 555 0109',
                'birth_date' => '2000-01-23',
                'gender' => 'Male',
                'civil_status' => 'Single',
                'address' => 'Cubao, Quezon City, Metro Manila',
                'dept' => 'OPS',
                'pos' => 'Client Success Specialist',
                'type' => 'regular',
                'hire_date' => '2025-02-01',
                'regularization_date' => '2025-08-01',
                'basic_salary' => 24000.00,
                'prev_salary' => 21000.00,
                'sss' => '34-1987654-2',
                'philhealth' => '12-654987321-5',
                'pagibig' => '1210-6549-8732',
                'tin' => '712-345-901-000',
                'bank_acct' => '0049-6549-8735',
            ],
            [
                'code' => 'EMP-2026-010',
                'first_name' => 'Beatriz',
                'middle_name' => 'Ocampo',
                'last_name' => 'Salazar',
                'email' => 'beatriz.salazar@payflow.ph',
                'phone' => '+63 917 555 0110',
                'birth_date' => '2002-06-14',
                'gender' => 'Female',
                'civil_status' => 'Single',
                'address' => 'Sampaloc, Manila',
                'dept' => 'HR',
                'pos' => 'People & Timekeeping Associate',
                'type' => 'probationary',
                'hire_date' => '2026-09-01',
                'regularization_date' => null,
                'basic_salary' => 19500.00,
                'prev_salary' => 19500.00,
                'sss' => '34-1092837-6',
                'philhealth' => '12-147258369-7',
                'pagibig' => '1210-1472-5836',
                'tin' => '812-369-258-000',
                'bank_acct' => '0049-1472-5839',
            ],
        ];

        foreach ($syntheticEmployees as $row) {
            $linkedUser = User::where('email', $row['email'])->first();

            $emp = Employee::updateOrCreate(
                ['employee_code' => $row['code']],
                [
                    'user_id' => $linkedUser?->id,
                    'first_name' => $row['first_name'],
                    'middle_name' => $row['middle_name'],
                    'last_name' => $row['last_name'],
                    'email' => $row['email'],
                    'phone' => $row['phone'],
                    'birth_date' => $row['birth_date'],
                    'gender' => $row['gender'],
                    'civil_status' => $row['civil_status'],
                    'address' => $row['address'],
                    'department_id' => $depts[$row['dept']]->id,
                    'position_id' => $positions[$row['pos']]->id,
                    'employment_type' => $row['type'],
                    'employment_status' => 'active',
                    'hire_date' => $row['hire_date'],
                    'regularization_date' => $row['regularization_date'],
                    'pay_type' => 'monthly',
                    'pay_frequency' => 'semi_monthly',
                    'basic_salary' => $row['basic_salary'],
                    'rice_subsidy' => 2000.00,
                    'clothing_allowance' => 500.00,
                    'medical_allowance' => 800.00,
                    'laundry_allowance' => 300.00,
                    'sss_no' => $row['sss'],
                    'philhealth_no' => $row['philhealth'],
                    'pagibig_no' => $row['pagibig'],
                    'tin_no' => $row['tin'],
                    'bank_name' => 'BDO Unibank',
                    'bank_account_no' => $row['bank_acct'],
                    'emergency_contact_name' => 'Roberto '.$row['last_name'],
                    'emergency_contact_phone' => '+63 918 888 0199',
                    'emergency_contact_relation' => 'Parent / Spouse',
                ]
            );

            if ($emp->salaryHistories()->count() === 0) {
                SalaryHistory::create([
                    'employee_id' => $emp->id,
                    'previous_salary' => 0,
                    'new_salary' => $row['prev_salary'],
                    'effective_date' => $row['hire_date'],
                    'reason' => 'Initial Hiring Rate',
                    'approved_by' => $adminUser?->id,
                ]);

                if ($row['basic_salary'] > $row['prev_salary']) {
                    SalaryHistory::create([
                        'employee_id' => $emp->id,
                        'previous_salary' => $row['prev_salary'],
                        'new_salary' => $row['basic_salary'],
                        'effective_date' => '2026-01-01',
                        'reason' => 'Annual Merit & Statutory Alignment Review',
                        'approved_by' => $adminUser?->id,
                    ]);
                }
            }
        }
    }
}
