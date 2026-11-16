<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayrollRun extends Model
{
    protected $fillable = [
        'run_code',
        'name',
        'cutoff_type',
        'period_start',
        'period_end',
        'pay_date',
        'status',
        'headcount',
        'total_gross_pay',
        'total_deductions',
        'total_net_pay',
        'total_employer_share',
        'prepared_by',
        'computed_at',
        'approved_by',
        'approved_at',
        'locked_by',
        'locked_at',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'period_end' => 'date',
            'pay_date' => 'date',
            'computed_at' => 'datetime',
            'approved_at' => 'datetime',
            'locked_at' => 'datetime',
            'total_gross_pay' => 'decimal:2',
            'total_deductions' => 'decimal:2',
            'total_net_pay' => 'decimal:2',
            'total_employer_share' => 'decimal:2',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(PayrollItem::class)->orderBy('employee_code');
    }

    public function preparer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'prepared_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function locker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'locked_by');
    }

    public function isImmutable(): bool
    {
        return in_array($this->status, ['approved', 'locked'], true);
    }
}

