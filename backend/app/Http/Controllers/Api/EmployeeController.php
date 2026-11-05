<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\SalaryHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmployeeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Employee::with(['department:id,code,name', 'position:id,title,level']);

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('employee_code', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($deptId = $request->integer('department_id')) {
            $query->where('department_id', $deptId);
        }

        if ($status = $request->string('status')->trim()->value()) {
            $query->where('employment_status', $status);
        }

        $canViewSensitive = $request->user()?->can('employees.view_sensitive') ?? false;
        $unmask = $canViewSensitive && $request->boolean('unmask');

        $employees = $query->orderBy('employee_code')
            ->get()
            ->map(fn (Employee $emp) => $this->transformEmployee($emp, $unmask));

        return response()->json([
            'data' => $employees,
            'meta' => [
                'total' => $employees->count(),
                'active_count' => $employees->where('employment_status', 'active')->count(),
                'total_monthly_basic' => round($employees->where('employment_status', 'active')->sum('basic_salary'), 2),
                'can_view_sensitive' => $canViewSensitive,
            ],
        ]);
    }

    public function show(Request $request, Employee $employee): JsonResponse
    {
        $employee->load([
            'department:id,code,name',
            'position:id,title,level',
            'salaryHistories.approver:id,name',
        ]);

        $canViewSensitive = $request->user()?->can('employees.view_sensitive') ?? false;
        $unmask = $canViewSensitive && $request->boolean('unmask');

        return response()->json([
            'employee' => $this->transformEmployee($employee, $unmask, true),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:80'],
            'middle_name' => ['nullable', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'email' => ['required', 'email', 'unique:employees,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'birth_date' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'max:20'],
            'civil_status' => ['required', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:255'],
            'department_id' => ['required', 'exists:departments,id'],
            'position_id' => ['required', 'exists:positions,id'],
            'employment_type' => ['required', 'in:regular,probationary,contractual'],
            'hire_date' => ['required', 'date'],
            'pay_type' => ['required', 'in:monthly,daily'],
            'pay_frequency' => ['required', 'in:semi_monthly,monthly'],
            'basic_salary' => ['required', 'numeric', 'min:1000'],
            'rice_subsidy' => ['nullable', 'numeric', 'min:0'],
            'clothing_allowance' => ['nullable', 'numeric', 'min:0'],
            'medical_allowance' => ['nullable', 'numeric', 'min:0'],
            'laundry_allowance' => ['nullable', 'numeric', 'min:0'],
            'sss_no' => ['nullable', 'string', 'max:30'],
            'philhealth_no' => ['nullable', 'string', 'max:30'],
            'pagibig_no' => ['nullable', 'string', 'max:30'],
            'tin_no' => ['nullable', 'string', 'max:30'],
            'bank_name' => ['nullable', 'string', 'max:80'],
            'bank_account_no' => ['nullable', 'string', 'max:40'],
            'emergency_contact_name' => ['nullable', 'string', 'max:120'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:30'],
            'emergency_contact_relation' => ['nullable', 'string', 'max:50'],
        ]);

        $employee = DB::transaction(function () use ($validated, $request) {
            $nextNum = Employee::count() + 1;
            $validated['employee_code'] = sprintf('EMP-2026-%03d', $nextNum);
            $validated['employment_status'] = 'active';

            $emp = Employee::create($validated);

            SalaryHistory::create([
                'employee_id' => $emp->id,
                'previous_salary' => 0,
                'new_salary' => $emp->basic_salary,
                'effective_date' => $emp->hire_date,
                'reason' => 'Initial Onboarding Compensation',
                'approved_by' => $request->user()?->id,
            ]);

            return $emp->load(['department:id,code,name', 'position:id,title,level', 'salaryHistories.approver:id,name']);
        });

        return response()->json([
            'employee' => $this->transformEmployee($employee, false, true),
        ], 201);
    }

    public function reviseSalary(Request $request, Employee $employee): JsonResponse
    {
        $validated = $request->validate([
            'new_salary' => ['required', 'numeric', 'min:1000'],
            'effective_date' => ['required', 'date'],
            'reason' => ['required', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($employee, $validated, $request) {
            $previousSalary = (float) $employee->basic_salary;

            SalaryHistory::create([
                'employee_id' => $employee->id,
                'previous_salary' => $previousSalary,
                'new_salary' => $validated['new_salary'],
                'effective_date' => $validated['effective_date'],
                'reason' => $validated['reason'],
                'approved_by' => $request->user()?->id,
            ]);

            $employee->update([
                'basic_salary' => $validated['new_salary'],
            ]);

            activity('compensation')
                ->performedOn($employee)
                ->causedBy($request->user())
                ->withProperties([
                    'employee_code' => $employee->employee_code,
                    'previous_salary' => $previousSalary,
                    'new_salary' => (float) $validated['new_salary'],
                    'reason' => $validated['reason'],
                    'ip' => $request->ip(),
                ])
                ->event('salary_revised')
                ->log("Revised basic salary for {$employee->full_name} ({$employee->employee_code})");
        });

        $employee->load(['department:id,code,name', 'position:id,title,level', 'salaryHistories.approver:id,name']);

        return response()->json([
            'employee' => $this->transformEmployee($employee, false, true),
        ]);
    }

    private function transformEmployee(Employee $emp, bool $unmask = false, bool $detailed = false): array
    {
        $data = [
            'id' => $emp->id,
            'employee_code' => $emp->employee_code,
            'first_name' => $emp->first_name,
            'middle_name' => $emp->middle_name,
            'last_name' => $emp->last_name,
            'full_name' => $emp->full_name,
            'email' => $emp->email,
            'phone' => $emp->phone,
            'birth_date' => $emp->birth_date?->format('Y-m-d'),
            'gender' => $emp->gender,
            'civil_status' => $emp->civil_status,
            'address' => $emp->address,
            'department_id' => $emp->department_id,
            'department' => $emp->department,
            'position_id' => $emp->position_id,
            'position' => $emp->position,
            'employment_type' => $emp->employment_type,
            'employment_status' => $emp->employment_status,
            'hire_date' => $emp->hire_date?->format('Y-m-d'),
            'regularization_date' => $emp->regularization_date?->format('Y-m-d'),
            'pay_type' => $emp->pay_type,
            'pay_frequency' => $emp->pay_frequency,
            'basic_salary' => (float) $emp->basic_salary,
            'rice_subsidy' => (float) $emp->rice_subsidy,
            'clothing_allowance' => (float) $emp->clothing_allowance,
            'medical_allowance' => (float) $emp->medical_allowance,
            'laundry_allowance' => (float) $emp->laundry_allowance,
            'total_allowances' => $emp->total_allowances,
            'sss_no' => $unmask ? $emp->sss_no : Employee::maskId($emp->sss_no),
            'philhealth_no' => $unmask ? $emp->philhealth_no : Employee::maskId($emp->philhealth_no),
            'pagibig_no' => $unmask ? $emp->pagibig_no : Employee::maskId($emp->pagibig_no),
            'tin_no' => $unmask ? $emp->tin_no : Employee::maskId($emp->tin_no),
            'bank_name' => $emp->bank_name,
            'bank_account_no' => $unmask ? $emp->bank_account_no : Employee::maskId($emp->bank_account_no),
            'is_unmasked' => $unmask,
            'work_schedule_start' => $emp->work_schedule_start,
            'work_schedule_end' => $emp->work_schedule_end,
            'emergency_contact_name' => $emp->emergency_contact_name,
            'emergency_contact_phone' => $emp->emergency_contact_phone,
            'emergency_contact_relation' => $emp->emergency_contact_relation,
        ];

        if ($detailed) {
            $data['salary_histories'] = $emp->salaryHistories->map(fn (SalaryHistory $sh) => [
                'id' => $sh->id,
                'previous_salary' => (float) $sh->previous_salary,
                'new_salary' => (float) $sh->new_salary,
                'effective_date' => $sh->effective_date?->format('Y-m-d'),
                'reason' => $sh->reason,
                'approver_name' => $sh->approver?->name ?? 'System',
            ]);
        }

        return $data;
    }
}
