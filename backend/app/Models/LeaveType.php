<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class LeaveType extends Model
{
    use LogsActivity;

    protected $fillable = [
        'code',
        'name',
        'category',
        'default_annual_days',
        'min_tenure_months',
        'is_paid',
        'is_convertible_to_cash',
        'carry_over_cap',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'default_annual_days' => 'decimal:2',
            'min_tenure_months' => 'integer',
            'is_paid' => 'boolean',
            'is_convertible_to_cash' => 'boolean',
            'carry_over_cap' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['code', 'name', 'category', 'default_annual_days', 'min_tenure_months', 'is_paid', 'carry_over_cap'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}

