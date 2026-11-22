<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->admin()->create([
            'name' => 'Administrator',
            'email' => 'admin@smartedu.com',
            'password' => 'password'
        ]);

        User::factory()->create([
            'name' => 'Siswa',
            'email' => 'siswa@smartedu.com',
            'password' => 'password'
        ]);
    }
}
