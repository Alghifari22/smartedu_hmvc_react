<?php

namespace Modules\ModulManagement\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ModulRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $modul = $this->route('modul');

        return [
            'kode_modul' => ['required', 'string', 'max:255'],
            'judul' => ['required', 'string', 'max:255'],
            'mata_pelajaran' => ['required', 'string', 'max:255'],
            'kelas' => ['required', 'string', 'max:255'],
            'berkas' => [$modul ? 'nullable' : 'required', 'file', 'mimes:pdf', 'max:5120']
        ];
    }

    public function messages(): array {
        return [
            'berkas.required' => 'Berkas wajib diunggah.', 
            'berkas.mimes' => 'Berkas harus berformat pdf.', 
            'berkas.max' => 'Ukuran berkas maksimal 5 MB.',
        ];
    }

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }
}
