
import { Head } from '@inertiajs/react';
import {
    FileImage,
    FileText,
    LoaderCircle,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AlertMessage } from '@/components/alert-message';
import { ConfirmDialog } from '@/components/confirm-dialog';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { ValidationErrors } from '@/lib/http';
import { http, HttpError } from '@/lib/http';
import type { BreadcrumbItem } from '@/types';

// Struktur data sesuai tabel modul.
type Modul = {
    id: number;
    kode_modul: string;
    judul: string;
    mata_pelajaran: string;
    kelas: string;
    berkas: string | null;
    nama_berkas: string | null;
    berkas_url?: string | null;
};

type FormFields = Pick<
    Modul,
    'kode_modul' | 'judul' | 'mata_pelajaran' | 'kelas'
>;

type Message = {
    type: 'success' | 'error';
    text: string;
} | null;

const emptyForm: FormFields = {
    kode_modul: '',
    judul: '',
    mata_pelajaran: '',
    kelas: '',
};

const fields: {
    name: keyof FormFields;
    label: string;
    placeholder: string;
}[] = [
    {
        name: 'kode_modul',
        label: 'Kode Modul',
        placeholder: 'Contoh: MOD-001',
    },
    {
        name: 'judul',
        label: 'Judul Modul',
        placeholder: 'Masukkan judul modul',
    },
    {
        name: 'mata_pelajaran',
        label: 'Mata Pelajaran',
        placeholder: 'Contoh: Matematika',
    },
    {
        name: 'kelas',
        label: 'Kelas',
        placeholder: 'Contoh: Kelas 4',
    },
];

const urls = {
    data: '/modul/data',
    store: '/modul',
    edit: (id: number) => `/modul/${id}/edit`,
    update: (id: number) => `/modul/${id}`,
    destroy: (id: number) => `/modul/${id}`,
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Modul', href: '/modul' },
];

// Komponen untuk menampilkan tautan berkas modul.
function FileLink({
    url,
    name,
}: {
    url: string | null | undefined;
    name: string | null;
}) {
    if (!url) {
        return <span className="text-muted-foreground">-</span>;
    }

    const isImage =
        /\.(jpg|jpeg|png|gif|webp)$/i.test(name ?? '');

    const Icon = isImage ? FileImage : FileText;

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary inline-flex items-center gap-1 underline-offset-4 hover:underline"
        >
            <Icon className="size-4" />
            {name ?? 'Lihat berkas'}
        </a>
    );
}

export default function Index() {
    const [records, setRecords] = useState<Modul[]>([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [message, setMessage] = useState<Message>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Modul | null>(null);
    const [form, setForm] = useState<FormFields>({ ...emptyForm });

    const [file, setFile] = useState<File | null>(null);
    const [fileInputKey, setFileInputKey] = useState(0);
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [saving, setSaving] = useState(false);

    const [deleting, setDeleting] = useState<Modul | null>(null);
    const [processingDelete, setProcessingDelete] = useState(false);

    const showError = useCallback((error: unknown, fallback: string) => {
        const errorMessage =
            error instanceof HttpError
                ? (error.data?.message ?? fallback)
                : fallback;

        setMessage({ type: 'error', text: errorMessage });
    }, []);

    // Mengambil seluruh data modul.
    const loadData = useCallback(async () => {
        setLoading(true);

        try {
            const data = await http<Modul[]>(urls.data);
            setRecords(data);
        } catch (error) {
            showError(error, 'Gagal memuat data modul.');
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    // Fitur pencarian data modul.
    const filtered = useMemo(() => {
        const query = keyword.trim().toLowerCase();

        if (!query) {
            return records;
        }

        return records.filter((item) =>
            [
                item.kode_modul,
                item.judul,
                item.mata_pelajaran,
                item.kelas,
            ].some((value) => value.toLowerCase().includes(query)),
        );
    }, [records, keyword]);

    const resetFileAndErrors = () => {
        setFile(null);
        setFileInputKey((key) => key + 1);
        setErrors({});
    };

    // Membuka form tambah modul.
    const openCreate = () => {
        setEditing(null);
        setForm({ ...emptyForm });
        resetFileAndErrors();
        setDialogOpen(true);
    };

    // Mengambil data modul untuk form edit.
    const openEdit = async (id: number) => {
        try {
            const data = await http<Modul>(urls.edit(id));

            setEditing(data);
            setForm({
                kode_modul: data.kode_modul,
                judul: data.judul,
                mata_pelajaran: data.mata_pelajaran,
                kelas: data.kelas,
            });

            resetFileAndErrors();
            setDialogOpen(true);
        } catch (error) {
            showError(error, 'Data modul tidak ditemukan.');
        }
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;

        setForm((currentForm) => ({
            ...currentForm,
            [name]: value,
        }));
    };

    // Menyimpan data modul dan berkas.
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (saving) {
            return;
        }

        setSaving(true);
        setErrors({});

        const formData = new FormData();

        Object.entries(form).forEach(([key, value]) => {
            formData.append(key, value);
        });

        if (file) {
            formData.append('berkas', file);
        }

        // Method spoofing untuk update multipart Laravel.
        if (editing) {
            formData.append('_method', 'PUT');
        }

        try {
            const result = await http<{ success: string }>(
                editing ? urls.update(editing.id) : urls.store,
                {
                    method: 'POST',
                    body: formData,
                },
            );

            setDialogOpen(false);
            setMessage({
                type: 'success',
                text: result.success ?? 'Data modul berhasil disimpan.',
            });

            await loadData();
        } catch (error) {
            if (error instanceof HttpError && error.status === 422) {
                setErrors(error.data?.errors ?? {});
            } else {
                showError(error, 'Terjadi kesalahan, silakan coba lagi.');
            }
        } finally {
            setSaving(false);
        }
    };

    // Menghapus data modul.
    const handleDelete = async () => {
        if (!deleting || processingDelete) {
            return;
        }

        setProcessingDelete(true);

        try {
            const result = await http<{ success: string }>(
                urls.destroy(deleting.id),
                { method: 'DELETE' },
            );

            setMessage({
                type: 'success',
                text: result.success ?? 'Data modul berhasil dihapus.',
            });

            await loadData();
        } catch (error) {
            showError(error, 'Data gagal dihapus.');
        } finally {
            setProcessingDelete(false);
            setDeleting(null);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Modul" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h1 className="flex items-center gap-2 text-xl font-semibold">
                            Data Modul Pembelajaran
                            <Badge variant="secondary">
                                {records.length}
                            </Badge>
                        </h1>

                        <p className="text-muted-foreground text-sm">
                            Kelola modul pembelajaran beserta berkas pendukungnya.
                        </p>
                    </div>

                    <Button onClick={openCreate}>
                        <Plus />
                        Tambah Modul
                    </Button>
                </div>

                <AlertMessage
                    type={message?.type ?? 'success'}
                    message={message?.text}
                    onClose={() => setMessage(null)}
                />

                {/* Pencarian */}
                <div className="relative max-w-sm">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />

                    <Input
                        value={keyword}
                        onChange={(event) => setKeyword(event.target.value)}
                        placeholder="Cari kode, judul, mata pelajaran..."
                        className="pl-9"
                    />
                </div>

                {/* Tabel data modul */}
                <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-left">
                            <tr>
                                <th className="px-4 py-3 font-medium">No</th>
                                <th className="px-4 py-3 font-medium">
                                    Kode Modul
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Judul Modul
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Mata Pelajaran
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Kelas
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Berkas
                                </th>
                                <th className="px-4 py-3 text-right font-medium">
                                    Aksi
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="text-muted-foreground px-4 py-8 text-center"
                                    >
                                        <LoaderCircle className="mx-auto size-5 animate-spin" />
                                        <span className="sr-only">
                                            Memuat data...
                                        </span>
                                    </td>
                                </tr>
                            )}

                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="text-muted-foreground px-4 py-8 text-center"
                                    >
                                        {records.length === 0
                                            ? 'Belum ada data modul.'
                                            : 'Data tidak ditemukan.'}
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                filtered.map((item, index) => (
                                    <tr key={item.id} className="border-t">
                                        <td className="px-4 py-3">
                                            {index + 1}
                                        </td>

                                        <td className="px-4 py-3 font-medium">
                                            {item.kode_modul}
                                        </td>

                                        <td className="px-4 py-3">
                                            {item.judul}
                                        </td>

                                        <td className="px-4 py-3">
                                            {item.mata_pelajaran}
                                        </td>

                                        <td className="px-4 py-3">
                                            {item.kelas}
                                        </td>

                                        <td className="px-4 py-3">
                                            <FileLink
                                                url={item.berkas_url}
                                                name={item.nama_berkas}
                                            />
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        void openEdit(item.id)
                                                    }
                                                >
                                                    <Pencil />
                                                    Edit
                                                </Button>

                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        setDeleting(item)
                                                    }
                                                >
                                                    <Trash2 />
                                                    Hapus
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Dialog tambah dan edit */}
            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    if (!saving) {
                        setDialogOpen(open);
                    }
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <form
                        onSubmit={handleSubmit}
                        noValidate
                        className="space-y-4"
                    >
                        <DialogHeader>
                            <DialogTitle>
                                {editing ? 'Edit Modul' : 'Tambah Modul'}
                            </DialogTitle>

                            <DialogDescription>
                                Lengkapi informasi modul pembelajaran dan
                                unggah berkas pendukung.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Input data modul */}
                        {fields.map((field) => (
                            <div key={field.name} className="grid gap-2">
                                <Label htmlFor={field.name}>
                                    {field.label}{' '}
                                    <span className="text-red-500">*</span>
                                </Label>

                                <Input
                                    id={field.name}
                                    name={field.name}
                                    type="text"
                                    placeholder={field.placeholder}
                                    value={form[field.name]}
                                    onChange={handleChange}
                                    aria-invalid={Boolean(errors[field.name])}
                                />

                                <InputError
                                    message={errors[field.name]?.[0]}
                                />
                            </div>
                        ))}

                        {/* Upload berkas modul */}
                        <div className="grid gap-2">
                            <Label htmlFor="berkas">
                                Berkas Modul
                            </Label>

                            <Input
                                key={fileInputKey}
                                id="berkas"
                                type="file"
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png"
                                onChange={(event) =>
                                    setFile(event.target.files?.[0] ?? null)
                                }
                                aria-invalid={Boolean(errors.berkas)}
                            />

                            <p className="text-muted-foreground text-xs">
                                Format PDF, DOC, DOCX, PPT, PPTX, JPG, atau PNG.
                                {editing &&
                                    ' Kosongkan jika tidak ingin mengganti berkas.'}
                            </p>

                            {editing?.berkas_url && (
                                <p className="text-xs">
                                    Berkas saat ini:{' '}
                                    <FileLink
                                        url={editing.berkas_url}
                                        name={editing.nama_berkas}
                                    />
                                </p>
                            )}

                            <InputError message={errors.berkas?.[0]} />
                        </div>

                        <DialogFooter className="gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setDialogOpen(false)}
                                disabled={saving}
                            >
                                Batal
                            </Button>

                            <Button type="submit" disabled={saving}>
                                {saving && (
                                    <LoaderCircle className="animate-spin" />
                                )}
                                {saving ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Konfirmasi hapus */}
            <ConfirmDialog
                open={deleting !== null}
                description={`Yakin ingin menghapus modul ${deleting?.judul ?? ''} beserta berkasnya?`}
                processing={processingDelete}
                onConfirm={handleDelete}
                onOpenChange={(open) => {
                    if (!open && !processingDelete) {
                        setDeleting(null);
                    }
                }}
            />
        </AppLayout>
    );
}
