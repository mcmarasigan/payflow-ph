<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_types', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name');
            $table->enum('category', ['statutory', 'company'])->default('company');
            $table->decimal('default_annual_days', 5, 2)->default(5.00);
            $table->unsignedSmallInteger('min_tenure_months')->default(0);
            $table->boolean('is_paid')->default(true);
            $table->boolean('is_convertible_to_cash')->default(false);
            $table->decimal('carry_over_cap', 5, 2)->default(0.00);
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('leave_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('leave_type_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('year');
            $table->decimal('entitled_days', 5, 2)->default(0.00);
            $table->decimal('used_days', 5, 2)->default(0.00);
            $table->decimal('pending_days', 5, 2)->default(0.00);
            $table->timestamps();

            $table->unique(['employee_id', 'leave_type_id', 'year']);
        });

        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('leave_type_id')->constrained()->restrictOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('total_days', 5, 2);
            $table->boolean('is_paid')->default(true);
            $table->string('reason');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->string('review_remarks')->nullable();
            $table->timestamps();

            $table->index(['employee_id', 'start_date', 'status']);
        });

        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->date('work_date');
            $table->enum('day_type', [
                'ordinary',
                'rest_day',
                'special_non_working',
                'special_rest_day',
                'regular_holiday',
                'regular_holiday_rest_day',
            ])->default('ordinary');
            $table->string('time_in', 10)->nullable();
            $table->string('time_out', 10)->nullable();
            $table->decimal('worked_hours', 5, 2)->default(0.00);
            $table->unsignedInteger('late_minutes')->default(0);
            $table->unsignedInteger('undertime_minutes')->default(0);
            $table->decimal('night_diff_hours', 5, 2)->default(0.00);
            $table->enum('status', ['present', 'late', 'absent', 'on_leave', 'holiday'])->default('present');
            $table->string('remarks')->nullable();
            $table->timestamps();

            $table->unique(['employee_id', 'work_date']);
        });

        Schema::create('overtime_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->date('work_date');
            $table->enum('day_type', [
                'ordinary',
                'rest_day',
                'special_non_working',
                'special_rest_day',
                'regular_holiday',
                'regular_holiday_rest_day',
            ])->default('ordinary');
            $table->decimal('dole_multiplier', 5, 2)->default(1.25);
            $table->decimal('hours_requested', 5, 2);
            $table->decimal('night_diff_hours', 5, 2)->default(0.00);
            $table->string('reason');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->string('review_remarks')->nullable();
            $table->timestamps();

            $table->index(['employee_id', 'work_date', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('overtime_requests');
        Schema::dropIfExists('attendances');
        Schema::dropIfExists('leave_requests');
        Schema::dropIfExists('leave_balances');
        Schema::dropIfExists('leave_types');
    }
};

