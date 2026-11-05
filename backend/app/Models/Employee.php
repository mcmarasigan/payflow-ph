<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Employee extends Model
{
    use LogsActivity;

    protected $fillable = [
        'user_id',
        'employee_code',
        'first_name',
        'middle_name',
        'last_name',
        'email',
        'phone',
        'birth_date',
        'gender',
        'civil_status',
        'address',
        'department_id',
        'position_id',
        'employment_type',
        'employment_status',
        'hire_date',
        'regularization_date',
        'pay_type',
        'pay_frequency',
        'basic_salary',
        'rice_subsidy',
        'clothing_allowance',
        'medical_allowance',
        'laundry_allowance',
        'sss_no',
        'philhealth_no',
        'pagibig_no',
        'tin_no',
        'bank_name',
        'bank_account_no',
        'emergency_contact_name',
        'emergency_contact_phone',
        'emergency_contact_relation',
        'work_schedule_start',
        'work_schedule_end',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date:Y-m-d',
            'hire_date' => 'date:Y-m-d',
            'regularization_date' => 'date:Y-m-d',
            'basic_salary' => 'decimal:2',
            'rice_subsidy' => 'decimal:2',
            'clothing_allowance' => 'decimal:2',
            'medical_allowance' => 'decimal:2',
            'laundry_allowance' => 'decimal:2',
            // Encrypted at rest
            'sss_no' => 'encrypted',
            'philhealth_no' => 'encrypted',
            'pagibig_no' => 'encrypted',
            'tin_no' => 'encrypted',
            'bank_account_no' => 'encrypted',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }

    public function salaryHistories(): HasMany
    {
        return $this->hasMany(SalaryHistory::class)->latest('effective_date');
    }

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    public function getTotalAllowancesAttribute(): float
    {
        return round(
            (float) $this->rice_subsidy
            + (float) $this->clothing_allowance
            + (float) $this->medical_allowance
            + (float) $this->laundry_allowance,
            2
        );
    }

    public static function maskId(?string $value): string
    {
        if (! $value) {
            return 'Not Provided';
        }
        $len = strlen($value);
        if ($len <= 4) {
            return str_repeat('*', $len);
        }

        return substr($value, 0, 3).'-****-'.substr($value, -2);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly([
                'employee_code',
                'first_name',
                'last_name',
                'department_id',
                'position_id',
                'employment_type',
                'employment_status',
                'basic_salary',
                'pay_type',
                'pay_frequency',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
