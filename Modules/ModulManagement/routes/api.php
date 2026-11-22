<?php

use Illuminate\Support\Facades\Route;
use Modules\ModulManagement\Http\Controllers\ModulManagementController;

Route::middleware(['auth:sanctum'])->prefix('v1')->group(function () {
    Route::apiResource('modulmanagements', ModulManagementController::class)->names('modulmanagement');
});
