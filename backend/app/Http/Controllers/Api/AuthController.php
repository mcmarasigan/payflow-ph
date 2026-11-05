<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Spatie\Activitylog\Models\Activity;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid email or password credentials.'],
            ]);
        }

        $token = $user->createToken('payflow-spa')->plainTextToken;

        activity('auth')
            ->causedBy($user)
            ->withProperties([
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'role' => $user->getRoleNames()->first(),
            ])
            ->event('logged_in')
            ->log("User {$user->name} signed in to PayFlow PH");

        return response()->json([
            'token' => $token,
            'user' => $this->transformUser($user),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->transformUser($request->user()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            activity('auth')
                ->causedBy($user)
                ->withProperties(['ip' => $request->ip()])
                ->event('logged_out')
                ->log("User {$user->name} signed out");

            $user->currentAccessToken()?->delete();
        }

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    public function auditLogs(Request $request): JsonResponse
    {
        $logs = Activity::with('causer:id,name,email')
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (Activity $log) => [
                'id' => $log->id,
                'log_name' => $log->log_name,
                'event' => $log->event ?? 'activity',
                'description' => $log->description,
                'causer_name' => $log->causer?->name ?? 'System',
                'causer_email' => $log->causer?->email ?? 'system@payflow.ph',
                'properties' => $log->properties,
                'created_at' => $log->created_at?->toIso8601String(),
            ]);

        return response()->json(['data' => $logs]);
    }

    private function transformUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'job_title' => $user->job_title,
            'department_name' => $user->department_name,
            'roles' => $user->getRoleNames()->values(),
            'primary_role' => $user->getRoleNames()->first() ?? 'Employee',
            'permissions' => $user->getAllPermissions()->pluck('name')->values(),
        ];
    }
}
