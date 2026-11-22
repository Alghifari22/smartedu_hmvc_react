<?php

namespace Modules\ModulManagement\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Modules\ModulManagement\Http\Requests\ModulRequest;
use Modules\ModulManagement\Models\Modul;

class ModulManagementController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Inertia::render('ModulManagement::index');
    }

    public function getData() {
        return response()->json(Modul::latest()->get());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(ModulRequest $request) {
        $data = $request->safe()->except('berkas');

        $file = $request->file('berkas');
        $data['berkas'] = $file->store('berkas', 'public');
        $data['nama_berkas'] = $file->getClientOriginalName();

        Modul::create($data);

        return response()->json(['success' => 'Data berhasil disimpan.']);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Modul $modul)
    {
        return response()->json($modul);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ModulRequest $request, Modul $modul) {
        $data = $request->safe()->except('berkas');

        if($request->hasFile('berkas')){
            if($modul->berkas){
                Storage::disk('public')->delete($modul->berkas);
            }
            $file = $request->file('berkas');
            $data['berkas'] = $file->store('berkas', 'public');
            $data['nama_berkas'] = $file->getClientOriginalName();
        }

        $modul->update($data);

        return response()->json(['success' => 'Data berhasil diperbarui.']); 
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Modul $modul) {
        if ($modul->berkas) { 
            Storage::disk('public')->delete($modul->berkas); 
        } 

        $modul->delete(); 
        
        return response()->json(['success' => 'Data berhasil dihapus.']); 
    }
}
