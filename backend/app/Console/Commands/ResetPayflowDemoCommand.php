<?php

namespace App\Console\Commands;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ResetPayflowDemoCommand extends Command
{
    protected $signature = 'payflow:reset-demo';

    protected $description = 'Reset PayFlow PH synthetic demonstration data back to its clean initial state';

    public function handle(): int
    {
        $this->info('Resetting PayFlow PH demonstration database...');

        Schema::disableForeignKeyConstraints();

        $tablesToReset = [
            'payroll_items',
            'payroll_runs',
            'overtime_requests',
            'leave_requests',
            'leave_balances',
            'leave_types',
            'attendances',
            'salary_histories',
            'employees',
            'holidays',
            'positions',
            'departments',
            'activity_log',
        ];

        foreach ($tablesToReset as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->delete();
            }
        }

        Schema::enableForeignKeyConstraints();

        $this->call('db:seed', [
            '--class' => DatabaseSeeder::class,
            '--force' => true,
        ]);

        activity('system')
            ->withProperties(['mode' => 'automated_or_manual_reset'])
            ->event('demo_database_reset')
            ->log('Reset PayFlow PH synthetic demonstration database to initial baseline');

        $this->info('PayFlow PH demonstration data has been reset successfully.');

        return self::SUCCESS;
    }
}
