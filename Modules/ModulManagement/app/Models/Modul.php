<?php

namespace Modules\ModulManagement\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
// use Modules\ModulManagement\Database\Factories\ModulFactory;

class Modul extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $guarded = ['id'];
    protected $table = 'modul';

    protected $appends = [ 
        'berkas_url', 
    ];

    public function getBerkasUrlAttribute()
    {
        return $this->berkas
            ? asset('storage/' . $this->berkas)
            : null;
    }
}