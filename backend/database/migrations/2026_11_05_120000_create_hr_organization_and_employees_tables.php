<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('code', 20)->unique();
            $table->string('name');
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('positions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('level')->default('Mid-Level'); // Junior, Mid-Level, Senior, Lead, Managerial
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->date('date');
            $table->enum('type', ['regular', 'special_non_working'])->default('regular');
            $table->unsignedSmallInteger('year');
            $table->boolean('is_recurring')->default(true);
            $table->timestamps();

            $table->index(['year', 'date']);
        });

        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('employee_code', 30)->unique();
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('phone', 30)->nullable();
            $table->date('birth_date')->nullable();
            $table->string('gender', 20)->nullable();
            $table->string('civil_status', 20)->default('Single');
            $table->text('address')->nullable();

            $table->foreignId('department_id')->constrained()->restrictOnDelete();
            $table->foreignId('position_id')->constrained()->restrictOnDelete();
            $table->enum('employment_type', ['regular', 'probationary', 'contractual'])->default('regular');
            $table->enum('employment_status', ['active', 'on_leave', 'resigned', 'terminated'])->default('active');
            $table->date('hire_date');
            $table->date('regularization_date')->nullable();

            // Compensation (Strictly DECIMAL(12,2) — never float)
            $table->enum('pay_type', ['monthly', 'daily'])->default('monthly');
            $table->enum('pay_frequency', ['semi_monthly', 'monthly'])->default('semi_monthly');
            $table->decimal('basic_salary', 12, 2);
            $table->decimal('rice_subsidy', 12, 2)->default(2000.00);
            $table->decimal('clothing_allowance', 12, 2)->default(500.00);
            $table->decimal('medical_allowance', 12, 2)->default(800.00);
            $table->decimal('laundry_allowance', 12, 2)->default(300.00);

            // Sensitive Fields — Encrypted at rest using Laravel encrypted casts
            $table->text('sss_no')->nullable();
            $table->text('philhealth_no')->nullable();
            $table->text('pagibig_no')->nullable();
            $table->text('tin_no')->nullable();
            $table->string('bank_name')->default('BDO Unibank');
            $table->text('bank_account_no')->nullable();

            // Emergency Contact
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone', 30)->nullable();
            $table->string('emergency_contact_relation', 50)->nullable();

            // Work Schedule
            $table->string('work_schedule_start', 10)->default('09:00');
            $table->string('work_schedule_end', 10)->default('18:00');

            $table->timestamps();
        });

        Schema::create('salary_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->decimal('previous_salary', 12, 2);
            $table->decimal('new_salary', 12, 2);
            $table->date('effective_date');
            $table->string('reason');
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salary_histories');
        Schema::dropIfExists('employees');
        Schema::dropIfExists('holidays');
        Schema::dropIfExists('positions');
        Schema::dropIfExists('departments');
    }
};

