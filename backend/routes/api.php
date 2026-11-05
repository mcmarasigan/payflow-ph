<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\TimeAndLeaveController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/audit-logs', [AuthController::class, 'auditLogs'])
        ->middleware('role:Super Admin|HR Manager|Approver / Finance');

    // Phase 2: Organization & Holidays
    Route::get('/organization', [OrganizationController::class, 'overview']);
    Route::post('/organization/departments', [OrganizationController::class, 'storeDepartment'])
        ->middleware('permission:employees.manage');
    Route::post('/organization/positions', [OrganizationController::class, 'storePosition'])
        ->middleware('permission:employees.manage');
    Route::post('/organization/holidays', [OrganizationController::class, 'storeHoliday'])
        ->middleware('permission:employees.manage');

    // Phase 2: Employee 201 Files & Compensation
    Route::get('/employees', [EmployeeController::class, 'index'])
        ->middleware('permission:employees.view');
    Route::get('/employees/{employee}', [EmployeeController::class, 'show'])
        ->middleware('permission:employees.view');
    Route::post('/employees', [EmployeeController::class, 'store'])
        ->middleware('permission:employees.manage');
    Route::post('/employees/{employee}/revise-salary', [EmployeeController::class, 'reviseSalary'])
        ->middleware('permission:employees.manage');

    // Phase 3: Attendance, DTR, DOLE Overtime & Configurable Leave Policies
    Route::get('/time-and-leave', [TimeAndLeaveController::class, 'overview']);
    Route::post('/attendances', [TimeAndLeaveController::class, 'recordAttendance']);
    Route::post('/overtime-requests', [TimeAndLeaveController::class, 'fileOvertime']);
    Route::match(['post', 'patch'], '/overtime-requests/{overtimeRequest}/review', [TimeAndLeaveController::class, 'reviewOvertime'])
        ->middleware('permission:overtime.approve');
    Route::post('/leave-requests', [TimeAndLeaveController::class, 'fileLeave']);
    Route::match(['post', 'patch'], '/leave-requests/{leaveRequest}/review', [TimeAndLeaveController::class, 'reviewLeave'])
        ->middleware('permission:leaves.approve');
    Route::put('/leave-types/{leaveType}', [TimeAndLeaveController::class, 'updateLeavePolicy'])
        ->middleware('permission:employees.manage');
});
