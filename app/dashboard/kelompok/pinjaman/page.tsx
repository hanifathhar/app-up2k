"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, HandCoins, Pencil, Trash2, Search, Users, Banknote, Landmark, ChevronLeft, ChevronRight, X, List, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function PinjamanPage() {
  const [pinjamanList, setPinjamanList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nama_peminjam: "",
    keperluan_usaha: "",
    tanggal_pinjam: new Date().toISOString().split("T")[0],
    jumlah_pinjaman: "",
    lama_angsuran: "",
    jasa: "0"
  });

  const [showAngsuran, setShowAngsuran] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedPinjaman, setSelectedPinjaman] = useState<any>(null);
  const [angsuranData, setAngsuranData] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    angsuran_pokok: "",
    jasa: "0",
    iuran: "0",
    simpanan: "0"
  });
  const [editAngsuranId, setEditAngsuranId] = useState<number | null>(null);

  // Filter and Pagination states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchName, setSearchName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchPinjaman = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/up2k/pinjaman");
      const data = await res.json();
      if (!data.error) setPinjamanList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPinjaman();
  }, []);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, searchName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editId ? `/api/up2k/pinjaman/${editId}` : "/api/up2k/pinjaman";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowForm(false);
        setEditId(null);
        setFormData({ ...formData, nama_peminjam: "", keperluan_usaha: "", jumlah_pinjaman: "", lama_angsuran: "", jasa: "0" });
        fetchPinjaman();
      } else {
        const error = await res.json();
        alert("Gagal: " + error.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (item: any) => {
    setEditId(item.id);
    setFormData({
      nama_peminjam: item.nama_peminjam,
      keperluan_usaha: item.keperluan_usaha || "",
      tanggal_pinjam: new Date(item.tanggal_pinjam).toISOString().split("T")[0],
      jumlah_pinjaman: item.jumlah_pinjaman.toString(),
      lama_angsuran: item.lama_angsuran.toString(),
      jasa: item.jasa.toString()
    });
    setShowForm(true);
    setShowAngsuran(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus data pinjaman ini beserta seluruh riwayat angsurannya?")) return;
    try {
      const res = await fetch(`/api/up2k/pinjaman/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchPinjaman();
      } else {
        const error = await res.json();
        alert("Gagal menghapus: " + error.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAngsuran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPinjaman) return;
    try {
      const url = editAngsuranId ? `/api/up2k/angsuran/${editAngsuranId}` : "/api/up2k/angsuran";
      const method = editAngsuranId ? "PUT" : "POST";
      
      const payload = editAngsuranId ? {
        tanggal: angsuranData.tanggal,
        angsuran_pokok: angsuranData.angsuran_pokok,
        jasa: angsuranData.jasa,
        iuran: angsuranData.iuran,
        simpanan: angsuranData.simpanan
      } : {
        pinjamanId: selectedPinjaman.id,
        ...angsuranData
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setEditAngsuranId(null);
        if (!editAngsuranId) setShowAngsuran(false);
        setAngsuranData({ ...angsuranData, angsuran_pokok: "", jasa: "0", iuran: "0", simpanan: "0" });
        await fetchPinjaman();
        // If in detail view, update the selectedPinjaman to reflect changes
        if (showDetail) {
          const freshData = await fetch("/api/up2k/pinjaman");
          const data = await freshData.json();
          if (!data.error) {
            setPinjamanList(data);
            const updatedSelected = data.find((p: any) => p.id === selectedPinjaman.id);
            if (updatedSelected) setSelectedPinjaman(updatedSelected);
          }
        } else {
            setSelectedPinjaman(null);
        }
      } else {
        const error = await res.json();
        alert("Gagal: " + error.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAngsuran = async (id: number) => {
    if (!confirm("Yakin ingin menghapus data angsuran ini? Saldo dan status pinjaman akan dikalkulasi ulang.")) return;
    try {
      const res = await fetch(`/api/up2k/angsuran/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchPinjaman();
        // Update selectedPinjaman for detail view
        const freshData = await fetch("/api/up2k/pinjaman");
        const data = await freshData.json();
        if (!data.error) {
          setPinjamanList(data);
          const updatedSelected = data.find((p: any) => p.id === selectedPinjaman.id);
          if (updatedSelected) setSelectedPinjaman(updatedSelected);
        }
      } else {
        const error = await res.json();
        alert("Gagal menghapus angsuran: " + error.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Calculations for Summaries ---
  let totalPinjaman = 0;
  let totalAngsuranPokok = 0;
  let totalAngsuranJasa = 0;
  const uniqueBorrowers = new Set();

  pinjamanList.forEach(item => {
    uniqueBorrowers.add(item.nama_peminjam);
    totalPinjaman += Number(item.jumlah_pinjaman);
    item.angsuran.forEach((ang: any) => {
      totalAngsuranPokok += Number(ang.angsuran_pokok);
      totalAngsuranJasa += Number(ang.jasa);
    });
  });

  // --- Filter and Pagination ---
  const filteredPinjamanList = pinjamanList.filter(item => {
    const itemDate = new Date(item.tanggal_pinjam).toISOString().split("T")[0];
    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;
    if (searchName && !item.nama_peminjam.toLowerCase().includes(searchName.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredPinjamanList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPinjamanList = filteredPinjamanList.slice(startIndex, startIndex + itemsPerPage);

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=700,width=900');
    if (!printWindow) return alert("Pop-up diblokir. Izinkan pop-up untuk mencetak.");

    let rowsHtml = "";
    filteredPinjamanList.forEach((item, idx) => {
      const monthsData = Array(12).fill(null).map(() => ({ angsuran: 0, iuran: 0, simpanan: 0 }));
      item.angsuran.forEach((ang: any) => {
        const monthIndex = new Date(ang.tanggal).getMonth();
        monthsData[monthIndex].angsuran += Number(ang.angsuran_pokok);
        monthsData[monthIndex].iuran += Number(ang.iuran || 0);
        monthsData[monthIndex].simpanan += Number(ang.simpanan || 0);
      });

      let monthsHtml = "";
      monthsData.forEach(data => {
        monthsHtml += `
          <td style="text-align: right;">${data.angsuran > 0 ? data.angsuran.toLocaleString("id-ID") : ""}</td>
          <td style="text-align: right;">${data.iuran > 0 ? data.iuran.toLocaleString("id-ID") : ""}</td>
          <td style="text-align: right;">${data.simpanan > 0 ? data.simpanan.toLocaleString("id-ID") : ""}</td>
        `;
      });

      rowsHtml += `
        <tr>
          <td>${idx + 1}</td>
          <td style="white-space: nowrap;">${new Date(item.tanggal_pinjam).toLocaleDateString("id-ID")}</td>
          <td style="text-align: left;">${item.nama_peminjam}</td>
          <td style="text-align: left;">${item.keperluan_usaha || "-"}</td>
          <td style="text-align: right;">${Number(item.jumlah_pinjaman).toLocaleString("id-ID")}</td>
          <td></td>
          ${monthsHtml}
        </tr>
      `;
    });

    const monthsHeaders = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
      .map(month => `<th colspan="3">${month}</th>`)
      .join("");

    const subHeaders = Array(12).fill(0).map(() => `
      <th>Angsuran</th>
      <th>Iuran</th>
      <th>Simpanan</th>
    `).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Laporan Pinjaman</title>
          <style>
            @page { size: landscape; margin: 10mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: Arial, sans-serif; padding: 20px; color: #000; }
            h1 { text-align: center; font-size: 14px; margin-bottom: 20px; font-weight: bold; text-transform: uppercase; }
            table { border-collapse: collapse; width: 100%; font-size: 9px; }
            th, td { border: 1px solid black; padding: 2px 4px; text-align: center; }
            th { font-weight: bold; background-color: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>BUKU DAFTAR PINJAMAN, ANGSURAN, IURAN DAN SIMPANAN POKSUS UP2K PKK DESA SUGI KECAMATAN MARANCAR</h1>
          <table>
            <thead>
              <tr>
                <th rowspan="2">No</th>
                <th rowspan="2">Tanggal</th>
                <th rowspan="2">Nama</th>
                <th rowspan="2">Untuk Keperluan Usaha</th>
                <th rowspan="2">Jumlah Pinjaman</th>
                <th rowspan="2">Tanda Tangan</th>
                ${monthsHeaders}
              </tr>
              <tr>
                ${subHeaders}
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Data Pinjaman & Angsuran
          </h1>
          <p className="text-gray-500 text-sm mt-1">Kelola pinjaman, cicilan pokok, dan jasa/bunga.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handlePrint} className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 w-full sm:w-auto">
            <Printer size={18} className="mr-2" /> Cetak Laporan
          </Button>
          <Button onClick={() => {
            setEditId(null);
            setFormData({ nama_peminjam: "", keperluan_usaha: "", tanggal_pinjam: new Date().toISOString().split("T")[0], jumlah_pinjaman: "", lama_angsuran: "", jasa: "0" });
            setShowForm(!showForm);
            setShowAngsuran(false);
            setShowDetail(false);
          }} className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto">
            {showForm ? <><X className="mr-2" size={18} /> Batal</> : <><PlusCircle className="mr-2" size={18} /> Pinjaman Baru</>}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Landmark size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Pokok Pinjaman</p>
            <h3 className="text-xl font-bold text-gray-800">Rp {totalPinjaman.toLocaleString("id-ID")}</h3>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <Banknote size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Angsuran Masuk</p>
            <h3 className="text-xl font-bold text-gray-800">Rp {(totalAngsuranPokok + totalAngsuranJasa).toLocaleString("id-ID")}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-purple-100 flex items-center gap-4 ring-1 ring-purple-50">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-purple-600 font-medium">Total Peminjam</p>
            <h3 className="text-2xl font-bold text-purple-900">{uniqueBorrowers.size} Orang</h3>
          </div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-lg">{editId ? "Edit Data Pinjaman" : "Input Pinjaman Baru"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama Peminjam</label>
              <input 
                type="text" required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                value={formData.nama_peminjam}
                onChange={e => setFormData({...formData, nama_peminjam: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Untuk Keperluan Usaha</label>
              <input 
                type="text" required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                value={formData.keperluan_usaha}
                onChange={e => setFormData({...formData, keperluan_usaha: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tanggal Pinjam</label>
              <input 
                type="date" required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                value={formData.tanggal_pinjam}
                onChange={e => setFormData({...formData, tanggal_pinjam: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Jumlah Pinjaman (Rp)</label>
              <input 
                type="number" required min="1"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                value={formData.jumlah_pinjaman}
                onChange={e => setFormData({...formData, jumlah_pinjaman: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Lama Angsuran (Bulan)</label>
              <input 
                type="number" required min="1"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                value={formData.lama_angsuran}
                onChange={e => setFormData({...formData, lama_angsuran: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Jasa / Bunga (Rp)</label>
              <input 
                type="number" required min="0"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                value={formData.jasa}
                onChange={e => setFormData({...formData, jasa: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>Batal</Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">Simpan</Button>
          </div>
        </form>
      )}

      {showAngsuran && selectedPinjaman && !showDetail && (
        <form onSubmit={handleAngsuran} className="bg-green-50 p-6 rounded-xl shadow-sm border border-green-200 space-y-4">
          <h2 className="font-semibold text-lg text-green-800">
            {editAngsuranId ? "Edit Angsuran" : "Input Angsuran"}: {selectedPinjaman.nama_peminjam}
          </h2>
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 text-sm text-green-700 bg-green-100/50 p-3 rounded-lg border border-green-200/50">
            <p>Pokok Awal: <span className="font-semibold">Rp {Number(selectedPinjaman.jumlah_pinjaman).toLocaleString("id-ID")}</span></p>
            <p>Sisa Pokok: <span className="font-bold text-green-800">Rp {(selectedPinjaman.jumlah_pinjaman - selectedPinjaman.angsuran.reduce((acc: number, a: any) => acc + Number(a.angsuran_pokok), 0)).toLocaleString("id-ID")}</span></p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tanggal Angsuran</label>
              <input 
                type="date" required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-white"
                value={angsuranData.tanggal}
                onChange={e => setAngsuranData({...angsuranData, tanggal: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Angsuran Pokok (Rp)</label>
              <input 
                type="number" required min="1"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-white"
                value={angsuranData.angsuran_pokok}
                onChange={e => setAngsuranData({...angsuranData, angsuran_pokok: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Jasa (Rp)</label>
              <input 
                type="number" required min="0"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-white"
                value={angsuranData.jasa}
                onChange={e => setAngsuranData({...angsuranData, jasa: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Iuran (Rp)</label>
              <input 
                type="number" required min="0"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-white"
                value={angsuranData.iuran}
                onChange={e => setAngsuranData({...angsuranData, iuran: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Simpanan (Rp)</label>
              <input 
                type="number" required min="0"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-white"
                value={angsuranData.simpanan}
                onChange={e => setAngsuranData({...angsuranData, simpanan: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setShowAngsuran(false); setEditAngsuranId(null); }}>Batal</Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">Simpan Angsuran</Button>
          </div>
        </form>
      )}

      {showDetail && selectedPinjaman && (
        <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-200 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-lg text-blue-800">
              Detail Angsuran: {selectedPinjaman.nama_peminjam}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setShowDetail(false)} className="text-blue-600 hover:bg-blue-100">
              <X size={18} /> Tutup
            </Button>
          </div>
          
          <div className="bg-white rounded-lg border border-blue-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-blue-100/50 border-b border-blue-100">
                  <tr>
                    <th className="px-4 py-2 font-semibold text-blue-800">Ke</th>
                    <th className="px-4 py-2 font-semibold text-blue-800">Tanggal</th>
                    <th className="px-4 py-2 font-semibold text-blue-800 text-right">Pokok</th>
                    <th className="px-4 py-2 font-semibold text-blue-800 text-right">Jasa</th>
                    <th className="px-4 py-2 font-semibold text-blue-800 text-right">Iuran</th>
                    <th className="px-4 py-2 font-semibold text-blue-800 text-right">Simpanan</th>
                    <th className="px-4 py-2 font-semibold text-blue-800 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPinjaman.angsuran.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-4 text-gray-500">Belum ada angsuran.</td></tr>
                  ) : (
                    selectedPinjaman.angsuran.map((ang: any, idx: number) => (
                      <tr key={ang.id} className="border-b border-gray-50 hover:bg-blue-50/30">
                        <td className="px-4 py-3">{idx + 1}</td>
                        <td className="px-4 py-3">{new Date(ang.tanggal).toLocaleDateString("id-ID")}</td>
                        <td className="px-4 py-3 text-right">Rp {Number(ang.angsuran_pokok).toLocaleString("id-ID")}</td>
                        <td className="px-4 py-3 text-right">Rp {Number(ang.jasa).toLocaleString("id-ID")}</td>
                        <td className="px-4 py-3 text-right">Rp {Number(ang.iuran).toLocaleString("id-ID")}</td>
                        <td className="px-4 py-3 text-right">Rp {Number(ang.simpanan).toLocaleString("id-ID")}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 h-7 px-2"
                              onClick={() => {
                                setEditAngsuranId(ang.id);
                                setAngsuranData({
                                  tanggal: new Date(ang.tanggal).toISOString().split("T")[0],
                                  angsuran_pokok: ang.angsuran_pokok.toString(),
                                  jasa: ang.jasa.toString(),
                                  iuran: ang.iuran.toString(),
                                  simpanan: ang.simpanan.toString()
                                });
                                setShowAngsuran(true);
                                setShowDetail(false);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-800 hover:bg-red-100 h-7 px-2"
                              onClick={() => handleDeleteAngsuran(ang.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="font-medium text-gray-700">Daftar Pinjaman</h3>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
            <Input
              placeholder="Cari nama..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="h-9 bg-white text-sm w-full md:w-48"
            />
            <div className="flex items-center gap-2 w-full md:w-auto">
              <label className="text-sm text-gray-500 whitespace-nowrap w-14 md:w-auto">Mulai:</label>
              <Input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 bg-white text-sm flex-1 md:w-auto"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <label className="text-sm text-gray-500 whitespace-nowrap w-14 md:w-auto">Selesai:</label>
              <Input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 bg-white text-sm flex-1 md:w-auto"
              />
            </div>
            {(startDate || endDate || searchName) && (
              <Button variant="ghost" size="sm" onClick={() => { setStartDate(""); setEndDate(""); setSearchName(""); }} className="h-9 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 w-full md:w-auto justify-center">
                <X size={16} className="mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-700">Nama Peminjam</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Tgl Pinjam</th>
                <th className="px-6 py-3 font-semibold text-gray-700 text-right">Sisa Pokok</th>
                <th className="px-6 py-3 font-semibold text-gray-700 text-center">Tenor</th>
                <th className="px-6 py-3 font-semibold text-gray-700 text-center">Status</th>
                <th className="px-6 py-3 font-semibold text-gray-700 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8">Memuat data...</td></tr>
              ) : paginatedPinjamanList.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Belum ada data pinjaman.</td></tr>
              ) : (
                paginatedPinjamanList.map((item: any) => {
                  let sudahAngsur = item.angsuran.length;
                  let totalTerbayar = item.angsuran.reduce((acc: number, a: any) => acc + Number(a.angsuran_pokok), 0);
                  let sisaPokok = Number(item.jumlah_pinjaman) - totalTerbayar;

                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{item.nama_peminjam}</td>
                      <td className="px-6 py-4">{new Date(item.tanggal_pinjam).toLocaleDateString("id-ID")}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-semibold text-gray-900">Rp {sisaPokok.toLocaleString("id-ID")}</div>
                        <div className="text-xs text-gray-400 line-through">Rp {Number(item.jumlah_pinjaman).toLocaleString("id-ID")}</div>
                      </td>
                      <td className="px-6 py-4 text-center">{sudahAngsur} / {item.lama_angsuran} bln</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${item.status === 'LUNAS' || sisaPokok <= 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {sisaPokok <= 0 ? 'LUNAS' : item.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2 items-center">
                          {(item.status === 'BELUM_LUNAS' && sisaPokok > 0) && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-green-600 border-green-600 hover:bg-green-50 px-2"
                              onClick={() => {
                                setSelectedPinjaman(item);
                                setEditAngsuranId(null);
                                setAngsuranData({ ...angsuranData, angsuran_pokok: sisaPokok.toString() });
                                setShowAngsuran(true);
                                setShowForm(false);
                                setShowDetail(false);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              title="Bayar Angsuran"
                            >
                              <HandCoins size={16} className="mr-1" /> Angsur
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              setSelectedPinjaman(item);
                              setShowDetail(true);
                              setShowAngsuran(false);
                              setShowForm(false);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }} 
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
                            title="Detail Angsuran"
                          >
                            <List size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2">
                            <Pencil size={16} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden p-4 space-y-4 bg-gray-50/30">
          {loading ? (
            <div className="text-center py-8 text-sm text-gray-500">Memuat data...</div>
          ) : paginatedPinjamanList.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">Belum ada data pinjaman.</div>
          ) : (
            paginatedPinjamanList.map((item: any, index: number) => {
              let sudahAngsur = item.angsuran.length;
              let totalTerbayar = item.angsuran.reduce((acc: number, a: any) => acc + Number(a.angsuran_pokok), 0);
              let sisaPokok = Number(item.jumlah_pinjaman) - totalTerbayar;
              let isLunas = sisaPokok <= 0 || item.status === 'LUNAS';

              return (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-md ${isLunas ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {isLunas ? 'LUNAS' : item.status.replace("_", " ")}
                      </span>
                      <p className="font-semibold text-gray-800 mt-2 text-base">{item.nama_peminjam}</p>
                      <p className="text-xs text-gray-500">{new Date(item.tanggal_pinjam).toLocaleDateString("id-ID")}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} className="h-8 w-8 p-0 text-blue-600">
                        <Pencil size={14} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="h-8 w-8 p-0 text-red-600">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm border-t border-gray-100 pt-3 mt-2">
                    <div>
                      <p className="text-gray-500 text-[11px] uppercase tracking-wider font-medium mb-1">Awal Pinjam</p>
                      <p className="font-medium text-gray-700 line-through text-xs">
                        Rp {Number(item.jumlah_pinjaman).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-[11px] uppercase tracking-wider font-medium mb-1">Tenor</p>
                      <p className="font-medium text-gray-700">
                        {sudahAngsur} / {item.lama_angsuran} bln
                      </p>
                    </div>
                    <div className="col-span-2 mt-1 pt-3 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <p className="text-gray-500 text-xs font-medium">Sisa Pokok</p>
                        <p className="font-bold text-gray-900 text-base">
                          Rp {sisaPokok.toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                    {!isLunas && (
                      <div className="col-span-2 mt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="w-full text-green-600 border-green-600 hover:bg-green-50 mb-2"
                          onClick={() => {
                            setSelectedPinjaman(item);
                            setEditAngsuranId(null);
                            setAngsuranData({ ...angsuranData, angsuran_pokok: sisaPokok.toString() });
                            setShowAngsuran(true);
                            setShowForm(false);
                            setShowDetail(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          <HandCoins size={16} className="mr-2" /> Bayar Angsuran
                        </Button>
                      </div>
                    )}
                    <div className="col-span-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full text-blue-600 border-blue-600 hover:bg-blue-50"
                        onClick={() => {
                          setSelectedPinjaman(item);
                          setShowDetail(true);
                          setShowAngsuran(false);
                          setShowForm(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <List size={16} className="mr-2" /> Lihat Detail Angsuran
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && filteredPinjamanList.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between bg-gray-50/50 gap-4">
            <span className="text-sm text-gray-500 text-center sm:text-left">
              Menampilkan <span className="font-medium text-gray-900">{startIndex + 1}</span> hingga <span className="font-medium text-gray-900">{Math.min(startIndex + itemsPerPage, filteredPinjamanList.length)}</span> dari <span className="font-medium text-gray-900">{filteredPinjamanList.length}</span> data
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-9 px-3"
              >
                <ChevronLeft size={16} />
              </Button>
              <div className="text-sm text-gray-600 px-3 font-medium min-w-[3rem] text-center">
                {currentPage} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-9 px-3"
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
