<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Holiday;
use App\Models\Position;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    public function overview(): JsonResponse
    {
        $departments = Department::withCount('employees')
            ->with('positions:id,department_id,title,level')
            ->orderBy('name')
            ->get();

        $positions = Position::with('department:id,name,code')
            ->withCount('employees')
            ->orderBy('title')
            ->get();

        $holidays = Holiday::orderBy('date')->get();

        return response()->json([
            'departments' => $departments,
            'positions' => $positions,
            'holidays' => $holidays,
        ]);
    }

    public function storeDepartment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:20', 'unique:departments,code'],
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $dept = Department::create($validated);

        return response()->json(['department' => $dept], 201);
    }

    public function storePosition(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'department_id' => ['required', 'exists:departments,id'],
            'title' => ['required', 'string', 'max:120'],
            'level' => ['required', 'string', 'max:60'],
        ]);

        $pos = Position::create($validated);

        return response()->json(['position' => $pos->load('department:id,name,code')], 201);
    }

    public function storeHoliday(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'date' => ['required', 'date'],
            'type' => ['required', 'in:regular,special_non_working'],
        ]);

        $validated['year'] = (int) substr($validated['date'], 0, 4);
        $holiday = Holiday::create($validated);

        return response()->json(['holiday' => $holiday], 201);
    }
}

