"use client";

import { useEffect, useState } from "react";
import { BarChart3, Users, CreditCard, Activity } from "lucide-react";

export default function UP2KAdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/up2k/konsolidasi")
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center">Loading data konsolidasi...</div>;
  if (!data || data.error) return <div className="p-8 text-center text-red-500">Gagal memuat data: {data?.error || "Unknown error"}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 border-b pb-4">
        Dashboard Konsolidasi UP2K (Admin)
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Penerimaan BKU" 
          value={`Rp ${data.totalPenerimaan.toLocaleString()}`} 
          icon={<Activity className="text-green-500" size={24} />} 
        />
        <StatCard 
          title="Total Pengeluaran BKU" 
          value={`Rp ${data.totalPengeluaran.toLocaleString()}`} 
          icon={<CreditCard className="text-red-500" size={24} />} 
        />
        <StatCard 
          title="Saldo Kas BKU Total" 
          value={`Rp ${data.saldoBkuTotal.toLocaleString()}`} 
          icon={<BarChart3 className="text-blue-500" size={24} />} 
        />
        <StatCard 
          title="Total Pinjaman Beredar" 
          value={`Rp ${data.sisaPinjamanBeredar.toLocaleString()}`} 
          icon={<Users className="text-purple-500" size={24} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">Ringkasan Pinjaman & Angsuran</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Total Pinjaman Disalurkan</span>
              <span className="font-medium">Rp {data.totalPinjaman.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Total Angsuran Pokok Diterima</span>
              <span className="font-medium">Rp {data.totalAngsuranPokok.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Total Jasa (Bunga) Diterima</span>
              <span className="font-medium">Rp {data.totalJasaDiterima.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
          <p className="text-gray-400 text-center">
            Pilih menu Manajemen Kelompok untuk melihat detail per kelompok.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="p-3 bg-gray-50 rounded-lg">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
    </div>
  );
}
