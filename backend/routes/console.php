<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Phase 6: Automated nightly reset of synthetic demonstration data every midnight (Asia/Manila)
Schedule::command('payflow:reset-demo')
    ->dailyAt('00:00')
    ->timezone('Asia/Manila')
    ->withoutOverlapping();
