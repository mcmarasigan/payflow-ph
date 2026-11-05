<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Attendance extends Model
{
    use LogsActivity;

    protected $fillable = [
        'employee_id',
        'work_date',
        'day_type',
        'time_in',
        'time_out',
        'worked_hours',
        'late_minutes',
        'undertime_minutes',
        'night_diff_hours',
        'status',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'work_date' => 'date:Y-m-d',
            'worked_hours' => 'decimal:2',
            'late_minutes' => 'integer',
            'undertime_minutes' => 'integer',
            'night_diff_hours' => 'decimal:2',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['employee_id', 'work_date', 'time_in', 'time_out', 'late_minutes', 'undertime_minutes', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}

