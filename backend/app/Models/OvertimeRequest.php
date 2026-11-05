<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class OvertimeRequest extends Model
{
    use LogsActivity;

    public const DOLE_MULTIPLIERS = [
        'ordinary' => 1.25,
        'rest_day' => 1.69,
        'special_non_working' => 1.69,
        'special_rest_day' => 1.95,
        'regular_holiday' => 2.60,
        'regular_holiday_rest_day' => 3.38,
    ];

    protected $fillable = [
        'employee_id',
        'work_date',
        'day_type',
        'dole_multiplier',
        'hours_requested',
        'night_diff_hours',
        'reason',
        'status',
        'reviewed_by',
        'reviewed_at',
        'review_remarks',
    ];

    protected function casts(): array
    {
        return [
            'work_date' => 'date:Y-m-d',
            'dole_multiplier' => 'decimal:2',
            'hours_requested' => 'decimal:2',
            'night_diff_hours' => 'decimal:2',
            'reviewed_at' => 'datetime',
        ];
    }

    public static function doleMultiplierFor(string $dayType): float
    {
        return self::DOLE_MULTIPLIERS[$dayType] ?? 1.25;
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['employee_id', 'work_date', 'day_type', 'dole_multiplier', 'hours_requested', 'status', 'review_remarks'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}

