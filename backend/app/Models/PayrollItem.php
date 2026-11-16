<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollItem extends Model
{
    protected $fillable = [
        'payroll_run_id',
        'employee_id',
        'employee_code',
        'employee_name',
        'department_name',
        'position_title',
        'monthly_basic_salary',
        'daily_rate',
        'hourly_rate',
        'basic_pay',
        'overtime_hours',
        'overtime_pay',
        'night_diff_hours',
        'night_diff_pay',
        'holiday_pay',
        'de_minimis_allowance',
        'other_allowances',
        'thirteenth_month_pay',
        'gross_pay',
        'late_minutes',
        'undertime_minutes',
        'late_undertime_deduction',
        'lwop_days',
        'lwop_deduction',
        'sss_msc',
        'sss_ee',
        'philhealth_ee',
        'pagibig_ee',
        'taxable_income',
        'withholding_tax',
        'sss_er',
        'sss_ec',
        'philhealth_er',
        'pagibig_er',
        'total_employer_cost',
        'total_deductions',
        'net_pay',
        'computation_details',
    ];

    protected function casts(): array
    {
        return [
            'monthly_basic_salary' => 'decimal:2',
            'daily_rate' => 'decimal:2',
            'hourly_rate' => 'decimal:2',
            'basic_pay' => 'decimal:2',
            'overtime_hours' => 'decimal:2',
            'overtime_pay' => 'decimal:2',
            'night_diff_hours' => 'decimal:2',
            'night_diff_pay' => 'decimal:2',
            'holiday_pay' => 'decimal:2',
            'de_minimis_allowance' => 'decimal:2',
            'other_allowances' => 'decimal:2',
            'thirteenth_month_pay' => 'decimal:2',
            'gross_pay' => 'decimal:2',
            'late_undertime_deduction' => 'decimal:2',
            'lwop_days' => 'decimal:2',
            'lwop_deduction' => 'decimal:2',
            'sss_msc' => 'decimal:2',
            'sss_ee' => 'decimal:2',
            'philhealth_ee' => 'decimal:2',
            'pagibig_ee' => 'decimal:2',
            'taxable_income' => 'decimal:2',
            'withholding_tax' => 'decimal:2',
            'sss_er' => 'decimal:2',
            'sss_ec' => 'decimal:2',
            'philhealth_er' => 'decimal:2',
            'pagibig_er' => 'decimal:2',
            'total_employer_cost' => 'decimal:2',
            'total_deductions' => 'decimal:2',
            'net_pay' => 'decimal:2',
            'computation_details' => 'array',
        ];
    }

    public function payrollRun(): BelongsTo
    {
        return $this->belongsTo(PayrollRun::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}

