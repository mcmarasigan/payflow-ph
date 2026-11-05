<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Holiday extends Model
{
    use LogsActivity;

    protected $fillable = [
        'name',
        'date',
        'type',
        'year',
        'is_recurring',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'year' => 'integer',
            'is_recurring' => 'boolean',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'date', 'type', 'year', 'is_recurring'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
