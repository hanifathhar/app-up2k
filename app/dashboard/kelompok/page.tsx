"use client";

import { useEffect, useState } from "react";
import { BarChart3, Users, CreditCard, Activity } from "lucide-react";

export default function KelompokDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For now we use the same konsolidasi endpoint but maybe we need a specific one for kelompok
    // Actually, BKU and Pinjaman are separate endpoints. Let's fetch them and aggregate here for simplicity.
    const fetchData = async () => {
      try {
        const [bkuRes, pinjamanRes] = await Promise.all([
          fetch("/api/up2k/bku"),
          fetch("/api/up2k/pinjaman")
        ]);
        
        const bkuData = await bkuRes.json();
        const pinjamanData = await pinjamanRes.json();

        if (bkuData.error) throw new Error(bkuData.error);
        if (pinjamanData.error) throw new Error(pinjamanData.error);

        let saldoAkhir = bkuData.length > 0 ? bkuData[0].saldo : 0;
        let totalPenerimaan = 0;
        let totalPengeluaran = 0;
        bkuData.forEach((b: any) => {
          if (b.jenis === "PENERIMAAN") totalPenerimaan += Number(b.jumlah);
          if (b.jenis === "PENGELUARAN") totalPengeluaran += Number(b.jumlah);
        });

        let sisaPinjamanBeredar = 0;
        let pinjamanAktif = 0;
        pinjamanData.forEach((p: any) => {
          if (p.status === "BELUM_LUNAS") {
            pinjamanAktif++;
            let sisa = Number(p.jumlah_pinjaman);
            p.angsuran.forEach((a: any) => {
              sisa -= Number(a.angsuran_pokok);
            });
            sisaPinjamanBeredar += sisa;
          }
        });

        setData({
          saldoAkhir,
          totalPenerimaan,
          totalPengeluaran,
          sisaPinjamanBeredar,
          pinjamanAktif,
          namaKelompok: bkuData[0]?.kelompok?.nama_kelompok || pinjamanData[0]?.kelompok?.nama_kelompok || "Kelompok"
        });
      } catch (err: any) {
        console.error(err);
        setData({ error: err.message });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
  if (!data || data.error) return <div className="p-8 text-center text-red-500">Gagal memuat data: {data?.error || "Unknown error"}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 border-b pb-4">
        Dashboard {data.namaKelompok}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Saldo Akhir BKU" 
          value={`Rp ${Number(data.saldoAkhir).toLocaleString()}`} 
          icon={<BarChart3 className="text-blue-500" size={24} />} 
        />
        <StatCard 
          title="Penerimaan BKU" 
          value={`Rp ${Number(data.totalPenerimaan).toLocaleString()}`} 
          icon={<Activity className="text-green-500" size={24} />} 
        />
        <StatCard 
          title="Pengeluaran BKU" 
          value={`Rp ${Number(data.totalPengeluaran).toLocaleString()}`} 
          icon={<CreditCard className="text-red-500" size={24} />} 
        />
        <StatCard 
          title="Pinjaman Beredar" 
          value={`Rp ${Number(data.sisaPinjamanBeredar).toLocaleString()}`} 
          icon={<Users className="text-purple-500" size={24} />} 
          subtitle={`${data.pinjamanAktif} Peminjam Aktif`}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, subtitle }: { title: string, value: string, icon: React.ReactNode, subtitle?: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className="p-3 bg-gray-50 rounded-lg">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-xl font-bold text-gray-800 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
