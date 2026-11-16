<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_runs', function (Blueprint $table) {
            $table->id();
            $table->string('run_code', 30)->unique();
            $table->string('name');
            $table->enum('cutoff_type', ['semi_monthly_1st', 'semi_monthly_2nd', 'monthly'])->default('semi_monthly_2nd');
            $table->date('period_start');
            $table->date('period_end');
            $table->date('pay_date');
            $table->enum('status', ['draft', 'computed', 'approved', 'locked'])->default('draft');
            $table->unsignedInteger('headcount')->default(0);
            $table->decimal('total_gross_pay', 14, 2)->default(0.00);
            $table->decimal('total_deductions', 14, 2)->default(0.00);
            $table->decimal('total_net_pay', 14, 2)->default(0.00);
            $table->decimal('total_employer_share', 14, 2)->default(0.00);
            $table->foreignId('prepared_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('computed_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('locked_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('locked_at')->nullable();
            $table->string('remarks')->nullable();
            $table->timestamps();
        });

        Schema::create('payroll_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_run_id')->constrained()->cascadeOnDelete();
            $table->foreignId('employee_id')->constrained()->restrictOnDelete();

            // Immutable employee snapshot at time of payroll run
            $table->string('employee_code', 30);
            $table->string('employee_name');
            $table->string('department_name');
            $table->string('position_title');
            $table->decimal('monthly_basic_salary', 12, 2);
            $table->decimal('daily_rate', 10, 2);
            $table->decimal('hourly_rate', 10, 2);

            // Earnings
            $table->decimal('basic_pay', 12, 2)->default(0.00);
            $table->decimal('overtime_hours', 6, 2)->default(0.00);
            $table->decimal('overtime_pay', 12, 2)->default(0.00);
            $table->decimal('night_diff_hours', 6, 2)->default(0.00);
            $table->decimal('night_diff_pay', 12, 2)->default(0.00);
            $table->decimal('holiday_pay', 12, 2)->default(0.00);
            $table->decimal('de_minimis_allowance', 12, 2)->default(0.00);
            $table->decimal('other_allowances', 12, 2)->default(0.00);
            $table->decimal('thirteenth_month_pay', 12, 2)->default(0.00);
            $table->decimal('gross_pay', 12, 2)->default(0.00);

            // Attendance & Unpaid Leave Deductions
            $table->unsignedInteger('late_minutes')->default(0);
            $table->unsignedInteger('undertime_minutes')->default(0);
            $table->decimal('late_undertime_deduction', 12, 2)->default(0.00);
            $table->decimal('lwop_days', 5, 2)->default(0.00);
            $table->decimal('lwop_deduction', 12, 2)->default(0.00);

            // Statutory Employee Share (EE) & BIR TRAIN Withholding Tax
            $table->decimal('sss_msc', 12, 2)->default(0.00);
            $table->decimal('sss_ee', 12, 2)->default(0.00);
            $table->decimal('philhealth_ee', 12, 2)->default(0.00);
            $table->decimal('pagibig_ee', 12, 2)->default(0.00);
            $table->decimal('taxable_income', 12, 2)->default(0.00);
            $table->decimal('withholding_tax', 12, 2)->default(0.00);

            // Statutory Employer Share (ER)
            $table->decimal('sss_er', 12, 2)->default(0.00);
            $table->decimal('sss_ec', 12, 2)->default(0.00);
            $table->decimal('philhealth_er', 12, 2)->default(0.00);
            $table->decimal('pagibig_er', 12, 2)->default(0.00);
            $table->decimal('total_employer_cost', 12, 2)->default(0.00);

            // Summary Totals & Formula Trace
            $table->decimal('total_deductions', 12, 2)->default(0.00);
            $table->decimal('net_pay', 12, 2)->default(0.00);
            $table->json('computation_details')->nullable();
            $table->timestamps();

            $table->unique(['payroll_run_id', 'employee_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_items');
        Schema::dropIfExists('payroll_runs');
    }
};

