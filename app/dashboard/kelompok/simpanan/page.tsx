"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Landmark, ChevronLeft, ChevronRight, X, Printer,
  Users, CalendarDays, TrendingUp
} from "lucide-react";

export default function SimpananPage() {
  const [angsuranList, setAngsuranList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [kelompokList, setKelompokList] = useState<any[]>([]);

  // Filter & Pagination
  const [searchName, setSearchName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Print Modal
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printKelompokId, setPrintKelompokId] = useState<string>("all");
  const [printYear, setPrintYear] = useState<string>("all");
  const [printMonth, setPrintMonth] = useState<string>("all");

  const availableMonths = [
    { value: "0", label: "Januari" }, { value: "1", label: "Februari" },
    { value: "2", label: "Maret" }, { value: "3", label: "April" },
    { value: "4", label: "Mei" }, { value: "5", label: "Juni" },
    { value: "6", label: "Juli" }, { value: "7", label: "Agustus" },
    { value: "8", label: "September" }, { value: "9", label: "Oktober" },
    { value: "10", label: "November" }, { value: "11", label: "Desember" },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [meRes, dataRes] = await Promise.all([
        fetch("/api/me"),
        fetch("/api/up2k/simpanan"),
      ]);
      const meData = await meRes.json();
      const data = await dataRes.json();

      const adminStatus =
        meData.user?.level === "superadmin" ||
        meData.user?.level === "up2k_admin";
      setIsAdmin(adminStatus);

      if (adminStatus) {
        const kelRes = await fetch("/api/up2k/kelompok");
        const kelData = await kelRes.json();
        if (!kelData.error) setKelompokList(kelData);
      }

      if (!data.error) setAngsuranList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, startDate, endDate]);

  // Filter hanya angsuran yang punya simpanan > 0
  const filtered = angsuranList.filter((item) => {
    if (Number(item.simpanan) <= 0) return false;
    const itemDate = new Date(item.tanggal).toISOString().split("T")[0];
    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;
    if (
      searchName &&
      !item.pinjaman?.nama_peminjam
        ?.toLowerCase()
        .includes(searchName.toLowerCase())
    )
      return false;
    return true;
  });

  // Summary
  const totalSimpanan = filtered.reduce((acc, item) => acc + Number(item.simpanan), 0);
  const uniqueAnggota = new Set(filtered.map((item) => item.pinjaman?.nama_peminjam));
  const availableYears = Array.from(
    new Set(angsuranList.map((item) => new Date(item.tanggal).getFullYear()))
  ).sort((a, b) => b - a);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  // Print
  const executePrint = () => {
    const printWindow = window.open("", "", "height=700,width=900");
    if (!printWindow)
      return alert("Pop-up diblokir. Izinkan pop-up untuk mencetak.");

    let printData = angsuranList.filter((item) => Number(item.simpanan) > 0);
    if (isAdmin && printKelompokId !== "all") {
      printData = printData.filter(
        (item) => item.pinjaman?.kelompokId === Number(printKelompokId)
      );
    }
    if (printYear !== "all") {
      printData = printData.filter(
        (item) => new Date(item.tanggal).getFullYear() === Number(printYear)
      );
    }
    if (printMonth !== "all") {
      printData = printData.filter(
        (item) => new Date(item.tanggal).getMonth() === Number(printMonth)
      );
    }

    let headerKelompok = "GABUNGAN SEMUA KELOMPOK";
    if (!isAdmin && angsuranList.length > 0) {
      headerKelompok =
        angsuranList[0].pinjaman?.kelompok?.nama_kelompok?.toUpperCase() ||
        "KELOMPOK UP2K";
    } else if (isAdmin && printKelompokId !== "all") {
      const sel = kelompokList.find((k) => k.id === Number(printKelompokId));
      if (sel) headerKelompok = sel.nama_kelompok.toUpperCase();
    }

    let total = 0;
    let rowsHtml = "";
    printData.forEach((item, idx) => {
      const jumlah = Number(item.simpanan);
      total += jumlah;
      rowsHtml += `
        <tr>
          <td>${idx + 1}</td>
          <td>${new Date(item.tanggal).toLocaleDateString("id-ID")}</td>
          <td style="text-align:left">${item.pinjaman?.nama_peminjam || "-"}</td>
          <td style="text-align:left">${item.pinjaman?.kelompok?.nama_kelompok || "-"}</td>
          <td style="text-align:right">${jumlah.toLocaleString("id-ID")}</td>
        </tr>
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Simpanan</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
            h2 { text-align: center; font-size: 14px; margin-bottom: 20px; text-transform: uppercase; }
            table { border-collapse: collapse; width: 100%; font-size: 11px; }
            th, td { border: 1px solid black; padding: 4px 8px; text-align: center; }
            th { background-color: #f3f4f6; font-weight: bold; }
            .total-row { font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>BUKU SIMPANAN POKSUS UP2K PKK ${headerKelompok}<br/>DESA SUGI KECAMATAN MARANCAR</h2>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Nama Anggota</th>
                <th>Kelompok</th>
                <th>Jumlah Simpanan (Rp)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr class="total-row">
                <td colspan="4">TOTAL</td>
                <td style="text-align:right">${total.toLocaleString("id-ID")}</td>
              </tr>
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
      setShowPrintModal(false);
    }, 250);
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Landmark className="text-teal-600" size={26} />
            Buku Simpanan
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Rekap simpanan anggota dari data angsuran pinjaman.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowPrintModal(true)}
          className="bg-white border-teal-300 text-teal-700 hover:bg-teal-50 w-full sm:w-auto"
        >
          <Printer size={18} className="mr-2" /> Cetak Laporan
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-teal-100 flex items-center gap-4">
          <div className="p-3 bg-teal-100 text-teal-600 rounded-lg">
            <Landmark size={22} />
          </div>
          <div>
            <p className="text-xs text-teal-600 font-medium">Total Simpanan Terkumpul</p>
            <h3 className="text-xl font-bold text-teal-900">
              Rp {totalSimpanan.toLocaleString("id-ID")}
            </h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Jumlah Penabung</p>
            <h3 className="text-xl font-bold text-gray-800">
              {uniqueAnggota.size} Anggota
            </h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <CalendarDays size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Transaksi Simpanan</p>
            <h3 className="text-xl font-bold text-gray-800">
              {filtered.length} Transaksi
            </h3>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="font-medium text-gray-700">Daftar Pembayaran Simpanan</h3>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
            <Input
              placeholder="Cari nama..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="h-9 bg-white text-sm w-full md:w-48"
            />
            <div className="flex items-center gap-2 w-full md:w-auto">
              <label className="text-sm text-gray-500 whitespace-nowrap">Mulai:</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9 bg-white text-sm"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <label className="text-sm text-gray-500 whitespace-nowrap">Selesai:</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9 bg-white text-sm"
              />
            </div>
            {(searchName || startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSearchName(""); setStartDate(""); setEndDate(""); }}
                className="h-9 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <X size={16} className="mr-1" /> Reset
              </Button>
            )}
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-700">No</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Tanggal</th>
                <th className="px-6 py-3 font-semibold text-gray-700">Nama Anggota</th>
                {isAdmin && <th className="px-6 py-3 font-semibold text-gray-700">Kelompok</th>}
                <th className="px-6 py-3 font-semibold text-gray-700 text-right">Jumlah Simpanan</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8">Memuat data...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">Belum ada data simpanan.</td></tr>
              ) : (
                paginated.map((item, idx) => (
                  <tr key={item.id} className="border-b hover:bg-teal-50/30">
                    <td className="px-6 py-4 text-gray-500">{startIndex + idx + 1}</td>
                    <td className="px-6 py-4">{new Date(item.tanggal).toLocaleDateString("id-ID")}</td>
                    <td className="px-6 py-4 font-medium">{item.pinjaman?.nama_peminjam || "-"}</td>
                    {isAdmin && <td className="px-6 py-4 text-gray-600">{item.pinjaman?.kelompok?.nama_kelompok || "-"}</td>}
                    <td className="px-6 py-4 text-right font-semibold text-teal-700">
                      Rp {Number(item.simpanan).toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden p-4 space-y-3 bg-gray-50/30">
          {loading ? (
            <div className="text-center py-8 text-sm text-gray-500">Memuat data...</div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">Belum ada data simpanan.</div>
          ) : (
            paginated.map((item) => (
              <div key={item.id} className="bg-white border border-teal-100 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-800">{item.pinjaman?.nama_peminjam || "-"}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(item.tanggal).toLocaleDateString("id-ID")}
                    </p>
                    {isAdmin && (
                      <p className="text-xs text-gray-400 mt-0.5">{item.pinjaman?.kelompok?.nama_kelompok}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-teal-600 font-medium">Simpanan</p>
                    <p className="font-bold text-teal-800 text-base">
                      Rp {Number(item.simpanan).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between bg-gray-50/50 gap-4">
            <span className="text-sm text-gray-500">
              Menampilkan <span className="font-medium text-gray-900">{startIndex + 1}</span> hingga{" "}
              <span className="font-medium text-gray-900">{Math.min(startIndex + itemsPerPage, filtered.length)}</span>{" "}
              dari <span className="font-medium text-gray-900">{filtered.length}</span> transaksi
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="h-9 px-3">
                <ChevronLeft size={16} />
              </Button>
              <div className="text-sm text-gray-600 px-3 font-medium min-w-[3rem] text-center">
                {currentPage} / {totalPages}
              </div>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="h-9 px-3">
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Print Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 to-teal-700 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Printer size={18} /> Cetak Laporan Simpanan
              </h3>
              <button onClick={() => setShowPrintModal(false)} className="text-teal-100 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kelompok</label>
                  <select
                    value={printKelompokId}
                    onChange={(e) => setPrintKelompokId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5"
                  >
                    <option value="all">Gabungan (Semua Kelompok)</option>
                    {kelompokList.map((kel) => (
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
                    onChange={(e) => setPrintYear(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5"
                  >
                    <option value="all">Semua Tahun</option>
                    {availableYears.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Bulan</label>
                  <select
                    value={printMonth}
                    onChange={(e) => setPrintMonth(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2.5"
                  >
                    <option value="all">Semua Bulan</option>
                    {availableMonths.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowPrintModal(false)}>Batal</Button>
              <Button onClick={executePrint} className="bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2">
                <Printer size={16} /> Cetak Sekarang
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
