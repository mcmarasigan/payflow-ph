<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class SalaryHistory extends Model
{
    use LogsActivity;

    protected $fillable = [
        'employee_id',
        'previous_salary',
        'new_salary',
        'effective_date',
        'reason',
        'approved_by',
    ];

    protected function casts(): array
    {
        return [
            'previous_salary' => 'decimal:2',
            'new_salary' => 'decimal:2',
            'effective_date' => 'date:Y-m-d',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['employee_id', 'previous_salary', 'new_salary', 'effective_date', 'reason'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
