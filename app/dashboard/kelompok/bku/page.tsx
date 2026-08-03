"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Pencil, Trash2, Printer, ArrowDownToLine, ArrowUpFromLine, Wallet, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function BKUPage() {
  const [bkuList, setBkuList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    uraian: "",
    jenis: "PENERIMAAN",
    jumlah: ""
  });

  // Filter and Pagination states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchUraian, setSearchUraian] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Print Modal states
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printKelompokId, setPrintKelompokId] = useState<string>("all");
  const [printYear, setPrintYear] = useState<string>("all");
  const [printMonth, setPrintMonth] = useState<string>("all");
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [kelompokList, setKelompokList] = useState<any[]>([]);

  const fetchBku = async () => {
    setLoading(true);
    try {
      const [meRes, bkuRes] = await Promise.all([
        fetch("/api/me"),
        fetch("/api/up2k/bku")
      ]);
      const meData = await meRes.json();
      const data = await bkuRes.json();
      
      const adminStatus = meData.user?.level === 'admin' || meData.user?.level === 'superadmin' || meData.user?.level === 'up2k_admin';
      setIsAdmin(adminStatus);
      
      if (adminStatus) {
        const kelRes = await fetch("/api/up2k/kelompok");
        const kelData = await kelRes.json();
        if (!kelData.error) setKelompokList(kelData);
      }
      
      if (!data.error) setBkuList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBku();
  }, []);

  const availableYears = Array.from(new Set(bkuList.map(item => new Date(item.tanggal).getFullYear()))).sort((a, b) => b - a);
  const availableMonths = [
    { value: "0", label: "Januari" }, { value: "1", label: "Februari" }, { value: "2", label: "Maret" },
    { value: "3", label: "April" }, { value: "4", label: "Mei" }, { value: "5", label: "Juni" },
    { value: "6", label: "Juli" }, { value: "7", label: "Agustus" }, { value: "8", label: "September" },
    { value: "9", label: "Oktober" }, { value: "10", label: "November" }, { value: "11", label: "Desember" }
  ];

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, searchUraian]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editId ? `/api/up2k/bku/${editId}` : "/api/up2k/bku";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowForm(false);
        setEditId(null);
        setFormData({ ...formData, uraian: "", jumlah: "" });
        fetchBku();
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
      tanggal: new Date(item.tanggal).toISOString().split("T")[0],
      uraian: item.uraian,
      jenis: item.jenis,
      jumlah: item.jumlah.toString()
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus data ini? Saldo akan dihitung ulang secara otomatis.")) return;
    try {
      const res = await fetch(`/api/up2k/bku/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchBku();
      } else {
        const error = await res.json();
        alert("Gagal menghapus: " + error.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    setShowPrintModal(true);
  };

  const executePrint = () => {
    const printWindow = window.open('', '', 'height=700,width=900');
    if (!printWindow) return alert("Pop-up diblokir. Izinkan pop-up untuk mencetak.");

    let printData = [...bkuList];
    if (isAdmin && printKelompokId !== "all") {
      printData = printData.filter(item => item.kelompokId === Number(printKelompokId));
    }
    if (printYear !== "all") {
      printData = printData.filter(item => new Date(item.tanggal).getFullYear() === Number(printYear));
    }
    if (printMonth !== "all") {
      printData = printData.filter(item => new Date(item.tanggal).getMonth() === Number(printMonth));
    }

    let totalPenerimaan = 0;
    let totalPengeluaran = 0;

    let headerKelompok = "GABUNGAN SEMUA KELOMPOK";
    if (!isAdmin) {
       headerKelompok = bkuList.length > 0 && bkuList[0].kelompok?.nama_kelompok ? bkuList[0].kelompok.nama_kelompok.toUpperCase() : "KELOMPOK UP2K";
    } else if (printKelompokId !== "all") {
       const selected = kelompokList.find(k => k.id === Number(printKelompokId));
       if (selected) headerKelompok = selected.nama_kelompok.toUpperCase();
    }

    let rowsHtml = "";
    printData.forEach(item => {
      const isPenerimaan = item.jenis === "PENERIMAAN";
      const tanggalStr = new Date(item.tanggal).toLocaleDateString('id-ID');
      const jumlahStr = Number(item.jumlah).toLocaleString('id-ID');

      if (isPenerimaan) {
        totalPenerimaan += Number(item.jumlah);
        rowsHtml += `
          <tr>
            <td>${tanggalStr}</td>
            <td class="text-left">${item.uraian}</td>
            <td class="text-right">${jumlahStr}</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
        `;
      } else {
        totalPengeluaran += Number(item.jumlah);
        rowsHtml += `
          <tr>
            <td></td>
            <td></td>
            <td></td>
            <td>${tanggalStr}</td>
            <td>-</td>
            <td class="text-left">${item.uraian}</td>
            <td class="text-right">${jumlahStr}</td>
          </tr>
        `;
      }
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak BKU</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; padding: 20px; color: #000; }
            .header-title { text-align: center; font-weight: bold; margin-bottom: 20px; font-size: 16px; line-height: 1.2; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: center; }
            th, td { border: 1px solid black; padding: 6px 4px; }
            th { font-weight: bold; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .signatures { display: flex; justify-content: space-between; margin-top: 50px; text-align: center; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header-title">
            <div>BUKU KAS UP2K PKK - ${headerKelompok}</div>
            <div>DESA SUGI KECAMATAN MARANCAR</div>
            <div>KABUPATEN TAPANULI SELATAN</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th colspan="3">PENERIMAAN</th>
                <th colspan="4">PENGELUARAN</th>
              </tr>
              <tr>
                <th>TANGGAL<br/>1</th>
                <th>URAIAN<br/>2</th>
                <th>JUMLAH (Rp)<br/>3</th>
                <th>TANGGAL<br/>4</th>
                <th>NO. KWT<br/>5</th>
                <th>URAIAN<br/>6</th>
                <th>JUMLAH (Rp)<br/>7</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr style="font-weight: bold;">
                <td colspan="2">Jumlah</td>
                <td class="text-right">${totalPenerimaan.toLocaleString('id-ID')}</td>
                <td colspan="3">Jumlah</td>
                <td class="text-right">${totalPengeluaran.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>

          <div class="signatures">
            <div>
              <div>Mengetahui</div>
              <div>Ketua Poksus UP2K PKK</div>
              <br/><br/><br/><br/>
              <div style="font-weight: bold; text-decoration: underline;">Emmida</div>
            </div>
            <div>
              <div>Sugi, ....................................</div>
              <div>Kelompok UP2K PKK</div>
              <div>Bendahara</div>
              <br/><br/><br/><br/>
              <div style="font-weight: bold; text-decoration: underline;">Ratna Mutia</div>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Add small delay to ensure rendering before print dialog
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
      setShowPrintModal(false);
    }, 250);
  };

  // --- Calculations ---
  const todayStr = new Date().toISOString().split("T")[0];
  let saldoTotal = 0;
  let penerimaanHariIni = 0;
  let pengeluaranHariIni = 0;

  bkuList.forEach(item => {
    const jumlah = Number(item.jumlah);
    const itemDate = new Date(item.tanggal).toISOString().split("T")[0];
    
    if (item.jenis === "PENERIMAAN") {
      saldoTotal += jumlah;
      if (itemDate === todayStr) penerimaanHariIni += jumlah;
    } else {
      saldoTotal -= jumlah;
      if (itemDate === todayStr) pengeluaranHariIni += jumlah;
    }
  });

  // --- Filter and Pagination ---
  const filteredBkuList = bkuList.filter(item => {
    const itemDate = new Date(item.tanggal).toISOString().split("T")[0];
    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;
    if (searchUraian && !item.uraian.toLowerCase().includes(searchUraian.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredBkuList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBkuList = filteredBkuList.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Buku Kas Umum (BKU)
          </h1>
          <p className="text-gray-500 text-sm mt-1">Kelola pencatatan keuangan penerimaan dan pengeluaran.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint} className="flex items-center gap-2">
            <Printer size={18} />
            Cetak BKU
          </Button>
          <Button onClick={() => {
            setEditId(null);
            setFormData({ tanggal: todayStr, uraian: "", jenis: "PENERIMAAN", jumlah: "" });
            setShowForm(!showForm);
          }} className="bg-red-600 hover:bg-red-700 text-white">
            {showForm ? <><X size={18} className="mr-2"/> Batal</> : <><PlusCircle className="mr-2" size={18} /> Input Transaksi</>}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <ArrowDownToLine size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Penerimaan Hari Ini</p>
            <h3 className="text-xl font-bold text-gray-800">Rp {penerimaanHariIni.toLocaleString("id-ID")}</h3>
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <ArrowUpFromLine size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Pengeluaran Hari Ini</p>
            <h3 className="text-xl font-bold text-gray-800">Rp {pengeluaranHariIni.toLocaleString("id-ID")}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-blue-100 flex items-center gap-4 ring-1 ring-blue-50">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-sm text-blue-600 font-medium">Total Saldo Kas</p>
            <h3 className="text-2xl font-bold text-blue-900">Rp {saldoTotal.toLocaleString("id-ID")}</h3>
          </div>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-lg">{editId ? "Edit Transaksi" : "Input Transaksi Baru"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Tanggal</label>
              <input 
                type="date" 
                required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                value={formData.tanggal}
                onChange={e => setFormData({...formData, tanggal: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Jenis Transaksi</label>
              <select 
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                value={formData.jenis}
                onChange={e => setFormData({...formData, jenis: e.target.value})}
              >
                <option value="PENERIMAAN">Penerimaan</option>
                <option value="PENGELUARAN">Pengeluaran</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Uraian / Keterangan</label>
              <input 
                type="text" 
                required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                value={formData.uraian}
                onChange={e => setFormData({...formData, uraian: e.target.value})}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Jumlah (Rp)</label>
              <input 
                type="number" 
                required min="1"
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                value={formData.jumlah}
                onChange={e => setFormData({...formData, jumlah: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditId(null); }}>Batal</Button>
            <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">Simpan</Button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="font-medium text-gray-700">Daftar Transaksi</h3>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto mt-3 md:mt-0">
            <Input
              placeholder="Cari uraian..."
              value={searchUraian}
              onChange={(e) => setSearchUraian(e.target.value)}
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
            {(startDate || endDate || searchUraian) && (
              <Button variant="ghost" size="sm" onClick={() => { setStartDate(""); setEndDate(""); setSearchUraian(""); }} className="h-9 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 w-full md:w-auto justify-center">
                <X size={16} className="mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table id="print-table" className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-700">No</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Tanggal</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Uraian</th>
                <th className="px-6 py-3 font-semibold text-gray-700 text-right">Penerimaan</th>
                <th className="px-6 py-3 font-semibold text-gray-700 text-right">Pengeluaran</th>
                <th className="px-6 py-3 font-semibold text-gray-700 text-right">Saldo</th>
                <th className="px-6 py-3 font-semibold text-gray-700 text-center hide-print">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8">Memuat data...</td></tr>
              ) : paginatedBkuList.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">Belum ada transaksi BKU sesuai filter.</td></tr>
              ) : (
                paginatedBkuList.map((item: any, index: number) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-500">{startIndex + index + 1}</td>
                    <td className="px-6 py-4">{new Date(item.tanggal).toLocaleDateString("id-ID")}</td>
                    <td className="px-6 py-4">{item.uraian}</td>
                    <td className="px-6 py-4 text-right text-green-600">
                      {item.jenis === "PENERIMAAN" ? `Rp ${Number(item.jumlah).toLocaleString("id-ID")}` : "-"}
                    </td>
                    <td className="px-6 py-4 text-right text-red-600">
                      {item.jenis === "PENGELUARAN" ? `Rp ${Number(item.jumlah).toLocaleString("id-ID")}` : "-"}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      Rp {Number(item.saldo).toLocaleString("id-ID")}
                    </td>
                    <td className="px-6 py-4 text-center hide-print">
                      <div className="flex justify-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <Pencil size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden p-4 space-y-4 bg-gray-50/30">
          {loading ? (
            <div className="text-center py-8 text-sm text-gray-500">Memuat data...</div>
          ) : paginatedBkuList.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">Belum ada transaksi BKU sesuai filter.</div>
          ) : (
            paginatedBkuList.map((item: any, index: number) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm relative">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded-md text-gray-600">
                      {new Date(item.tanggal).toLocaleDateString("id-ID")}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">#{startIndex + index + 1}</span>
                  </div>
                  <div className="flex gap-1 -mt-1 -mr-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} className="h-8 w-8 p-0 text-blue-600">
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="h-8 w-8 p-0 text-red-600">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                
                <p className="font-medium text-gray-800 text-sm mb-3 leading-relaxed">{item.uraian}</p>
                
                <div className="grid grid-cols-2 gap-3 text-sm border-t border-gray-100 pt-3">
                  <div>
                    <p className="text-gray-500 text-[11px] uppercase tracking-wider font-medium mb-1">Penerimaan</p>
                    <p className="font-semibold text-green-600">
                      {item.jenis === "PENERIMAAN" ? `Rp ${Number(item.jumlah).toLocaleString("id-ID")}` : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-[11px] uppercase tracking-wider font-medium mb-1">Pengeluaran</p>
                    <p className="font-semibold text-red-600">
                      {item.jenis === "PENGELUARAN" ? `Rp ${Number(item.jumlah).toLocaleString("id-ID")}` : "-"}
                    </p>
                  </div>
                  <div className="col-span-2 mt-1 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <p className="text-gray-500 text-xs font-medium">Saldo Akhir</p>
                      <p className="font-bold text-gray-900 text-base">
                        Rp {Number(item.saldo).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && filteredBkuList.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between bg-gray-50/50 gap-4">
            <span className="text-sm text-gray-500 text-center sm:text-left">
              Menampilkan <span className="font-medium text-gray-900">{startIndex + 1}</span> hingga <span className="font-medium text-gray-900">{Math.min(startIndex + itemsPerPage, filteredBkuList.length)}</span> dari <span className="font-medium text-gray-900">{filteredBkuList.length}</span> data
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

      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-800 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2"><Printer size={18}/> Cetak Laporan BKU</h3>
              <button onClick={() => setShowPrintModal(false)} className="text-red-100 hover:text-white"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kelompok</label>
                  <select 
                    value={printKelompokId} 
                    onChange={e => setPrintKelompokId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="all">Gabungan (Semua Kelompok)</option>
                    {kelompokList.map(kel => (
                      <option key={kel.id} value={kel.id}>{kel.nama_kelompok}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Tahun</label>
                  <select 
                    value={printYear} 
                    onChange={e => setPrintYear(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="all">Semua Tahun</option>
                    {availableYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Bulan</label>
                  <select 
                    value={printMonth} 
                    onChange={e => setPrintMonth(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="all">Semua Bulan</option>
                    {availableMonths.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowPrintModal(false)}>Batal</Button>
              <Button onClick={executePrint} className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2">
                <Printer size={16}/>
                Cetak Sekarang
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
