<?php

namespace Modules\UserManagement\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\UserManagement\Http\Requests\StoreUserRequest;
use Modules\UserManagement\Http\Requests\UpdateUserRequest;

class UserManagementController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request) 
    { 
        $search = $request->string('search')->trim()->toString(); 
        $role = UserRole::tryFrom($request->string('role')->toString()); 
  
        $users = User::query() 
            ->when($search !== '', function (Builder $query) use ($search) { 
                $query->where(function (Builder $query) use ($search) { 
                    $query->where('name', 'like', "%{$search}%") 
                        ->orWhere('email', 'like', "%{$search}%"); 
                }); 
            }) 
            ->when($role, fn (Builder $query) => $query->where('role', $role)) 
            ->orderBy('name') 
            ->paginate(10) 
            ->withQueryString() 
            ->through(fn (User $user) => [ 
                'id' => $user->id, 
                'name' => $user->name, 
                'email' => $user->email, 
                'role' => $user->role->value, 
                'role_label' => $user->role->label(), 
                'created_at' => $user->created_at?->diffForHumans(), 
            ]); 
  
        return Inertia::render('UserManagement::index', [ 
            'users' => $users, 
            'filters' => [ 
                'search' => $search, 
                'role' => $role?->value ?? '', 
            ], 
            'roles' => $this->roleOptions(), 
        ]); 
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('UserManagement::create', [ 
            'roles' => $this->roleOptions(), 
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request) {
        User::create($request->validated());

        return redirect()->route('admin.users.index')->with('success', 'User berhasil ditambahkan.'); 
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user)
    {
        return Inertia::render('UserManagement::edit', [ 
            'user' => [ 
                'id' => $user->id, 
                'name' => $user->name, 
                'email' => $user->email, 
                'role' => $user->role->value, 
            ], 
            'roles' => $this->roleOptions(), 
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, User $user) {
        $attributes = $request->validated(); 
  
        if (blank($attributes['password'] ?? null)) { 
            unset($attributes['password']); 
        } 
  
        $user->update($attributes); 
  
        return redirect()->route('admin.users.index')->with('success', 'User berhasil diperbarui.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user) {
        if ($user->is($request->user())) { 
            return redirect()->route('admin.users.index')->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.'); 
        } 
  
        $user->delete(); 
  
        return redirect()->route('admin.users.index')->with('success', 'User berhasil dihapus.'); 
    }

    private function roleOptions(): array 
    { 
        return array_map( 
            fn (UserRole $role) => ['value' => $role->value, 'label' => $role->label()], 
            UserRole::cases(),
        ); 
    }
}
