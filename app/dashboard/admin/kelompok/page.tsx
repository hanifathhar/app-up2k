"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Loader2, Search, Edit2, Trash2, X, ChevronLeft, ChevronRight } from "lucide-react";

export default function ManajemenKelompokPage() {
  const [kelompok, setKelompok] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [namaKelompok, setNamaKelompok] = useState("");
  const [desa, setDesa] = useState("");
  const [ketua, setKetua] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchKelompok = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/up2k/kelompok");
      const data = await res.json();
      if (res.ok) {
        setKelompok(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKelompok();
  }, []);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleOpenAddForm = () => {
    setEditId(null);
    setNamaKelompok("");
    setDesa("");
    setKetua("");
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const handleOpenEditForm = (k: any) => {
    setEditId(k.id);
    setNamaKelompok(k.nama_kelompok);
    setDesa(k.desa || "");
    setKetua(k.ketua || "");
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kelompok "${nama}"?`)) return;
    
    setError("");
    setSuccess("");
    
    try {
      const res = await fetch(`/api/up2k/kelompok/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Gagal menghapus kelompok");
      } else {
        setSuccess("Kelompok berhasil dihapus!");
        fetchKelompok();
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sistem");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const url = editId ? `/api/up2k/kelompok/${editId}` : "/api/up2k/kelompok";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama_kelompok: namaKelompok, desa, ketua }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal menyimpan kelompok");
      } else {
        setSuccess(editId ? "Kelompok berhasil diperbarui!" : "Kelompok berhasil ditambahkan!");
        setShowForm(false);
        fetchKelompok(); // Refresh data
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sistem");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredKelompok = kelompok.filter(k => 
    k.nama_kelompok.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (k.desa && k.desa.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (k.ketua && k.ketua.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredKelompok.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedKelompok = filteredKelompok.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-red-600" />
            Manajemen Kelompok UP2K
          </h1>
          <p className="text-gray-500 text-sm mt-1">Kelola data kelompok pelaksana UP2K desa/kelurahan.</p>
        </div>
        <Button 
          onClick={showForm ? () => setShowForm(false) : handleOpenAddForm}
          className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
        >
          {showForm ? <><X size={18} /> Batal</> : <><Plus size={18} /> Tambah Kelompok</>}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg border border-green-100 text-sm">
          {success}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6 relative">
          <h2 className="font-semibold text-gray-800 mb-4">
            {editId ? "Edit Kelompok" : "Tambah Kelompok Baru"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="namaKelompok">Nama Kelompok <span className="text-red-500">*</span></Label>
              <Input
                id="namaKelompok"
                value={namaKelompok}
                onChange={(e) => setNamaKelompok(e.target.value)}
                placeholder="Contoh: Mawar Merah"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="desa">Desa / Kelurahan</Label>
              <Input
                id="desa"
                value={desa}
                onChange={(e) => setDesa(e.target.value)}
                placeholder="Contoh: Desa Suka Maju"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ketua">Nama Ketua</Label>
              <Input
                id="ketua"
                value={ketua}
                onChange={(e) => setKetua(e.target.value)}
                placeholder="Contoh: Ibu Ani"
                className="mt-1"
              />
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={submitting} className="w-full bg-red-600 hover:bg-red-700">
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : "Simpan Kelompok"}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-end">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              type="text"
              placeholder="Cari kelompok..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-white"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b">
              <tr>
                <th className="px-6 py-4">No</th>
                <th className="px-6 py-4">Nama Kelompok</th>
                <th className="px-6 py-4">Desa/Kelurahan</th>
                <th className="px-6 py-4">Ketua</th>
                <th className="px-6 py-4">Tanggal Dibuat</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-red-500" />
                    Memuat data...
                  </td>
                </tr>
              ) : paginatedKelompok.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Belum ada data kelompok atau pencarian tidak ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedKelompok.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500">{startIndex + index + 1}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{item.nama_kelompok}</td>
                    <td className="px-6 py-4">{item.desa || "-"}</td>
                    <td className="px-6 py-4">{item.ketua || "-"}</td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(item.dibuatPada).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenEditForm(item)}
                          className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                        >
                          <Edit2 size={14} className="mr-1" /> Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDelete(item.id, item.nama_kelompok)}
                          className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 size={14} className="mr-1" /> Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!loading && filteredKelompok.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <span className="text-sm text-gray-500">
              Menampilkan <span className="font-medium text-gray-900">{startIndex + 1}</span> hingga <span className="font-medium text-gray-900">{Math.min(startIndex + itemsPerPage, filteredKelompok.length)}</span> dari <span className="font-medium text-gray-900">{filteredKelompok.length}</span> data
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 px-2"
              >
                <ChevronLeft size={16} />
              </Button>
              <div className="text-sm text-gray-600 px-2 font-medium">
                {currentPage} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-8 px-2"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
