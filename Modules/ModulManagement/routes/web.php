<?php

use Illuminate\Support\Facades\Route;
use Modules\ModulManagement\Http\Controllers\ModulManagementController;

Route::middleware(['auth', 'role:admin,user'])->group(function () {
    Route::get('modul', [ModulManagementController::class, 'index'])->name('modul.index');
    Route::get('modul/data', [ModulManagementController::class, 'getData'])->name('modul.data');
    Route::post('modul', [ModulManagementController::class, 'store'])->name('modul.store');
    Route::get('modul/{modul}/edit', [ModulManagementController::class, 'edit'])->name('modul.edit');
    Route::put('modul/{modul}', [ModulManagementController::class, 'update'])->name('modul.update');
    Route::delete('modul/{modul}', [ModulManagementController::class, 'destroy'])->name('modul.destroy');
});