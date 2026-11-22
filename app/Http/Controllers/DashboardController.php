<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\ModulManagement\Models\Modul;

class DashboardController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
         return Inertia::render('dashboard', [ 
            'totalModul' => Modul::count(), 
            'totalUsers' => $request->user()->isAdmin() ? User::count() : null, 
        ]); 
    }
}
