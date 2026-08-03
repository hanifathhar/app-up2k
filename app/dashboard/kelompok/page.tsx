"use client";

import { useEffect, useState, useMemo } from "react";
import { BarChart3, Users, CreditCard, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function KelompokDashboard() {
  const [data, setData] = useState<any>(null);
  const [bkuRawData, setBkuRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [kelompokList, setKelompokList] = useState<any[]>([]);
  const [selectedKelompokId, setSelectedKelompokId] = useState<number | string>("");

  useEffect(() => {
    const init = async () => {
      try {
        const meRes = await fetch("/api/me");
        const meJson = await meRes.json();
        if (meJson.error) throw new Error(meJson.error);
        
        const adminStatus = meJson.user?.level === 'admin' || meJson.user?.level === 'superadmin' || meJson.user?.level === 'up2k_admin';
        setIsAdmin(adminStatus);

        if (adminStatus) {
          const kelRes = await fetch("/api/up2k/kelompok");
          const kelJson = await kelRes.json();
          if (!kelJson.error) {
            setKelompokList(kelJson);
            if (kelJson.length > 0) {
              setSelectedKelompokId(kelJson[0].id);
            } else {
              setSelectedKelompokId("USER_DEFAULT");
            }
          }
        } else {
          setSelectedKelompokId("USER_DEFAULT"); 
        }
      } catch (err: any) {
        console.error(err);
        setData({ error: err.message });
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedKelompokId === "") return;

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        let bkuUrl = "/api/up2k/bku";
        let pinjamanUrl = "/api/up2k/pinjaman";
        
        if (selectedKelompokId !== "USER_DEFAULT") {
          bkuUrl += `?kelompokId=${selectedKelompokId}`;
          pinjamanUrl += `?kelompokId=${selectedKelompokId}`;
        }

        const [bkuRes, pinjamanRes] = await Promise.all([
          fetch(bkuUrl),
          fetch(pinjamanUrl)
        ]);

        const bkuData = await bkuRes.json();
        const pinjamanData = await pinjamanRes.json();

        if (bkuData.error) throw new Error(bkuData.error);
        if (pinjamanData.error) throw new Error(pinjamanData.error);

        setBkuRawData(bkuData);

        let saldoAkhir = bkuData.length > 0 ? bkuData[bkuData.length - 1].saldo : 0;
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

        let namaKelompok = "Kelompok";
        if (selectedKelompokId !== "USER_DEFAULT") {
           const selected = kelompokList.find(k => k.id === selectedKelompokId);
           if (selected) {
             namaKelompok = selected.nama_kelompok;
           } else if (bkuData.length > 0 && bkuData[0]?.kelompok?.nama_kelompok) {
             namaKelompok = bkuData[0].kelompok.nama_kelompok;
           }
        } else {
           if (bkuData.length > 0 && bkuData[0]?.kelompok?.nama_kelompok) {
             namaKelompok = bkuData[0].kelompok.nama_kelompok;
           } else if (pinjamanData.length > 0 && pinjamanData[0]?.kelompok?.nama_kelompok) {
             namaKelompok = pinjamanData[0].kelompok.nama_kelompok;
           }
        }

        setData({
          saldoAkhir,
          totalPenerimaan,
          totalPengeluaran,
          sisaPinjamanBeredar,
          pinjamanAktif,
          namaKelompok
        });
      } catch (err: any) {
        console.error(err);
        setData({ error: err.message });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [selectedKelompokId, kelompokList]);

  const availableYears = useMemo(() => {
    if (!bkuRawData.length) return [new Date().getFullYear()];
    const years = bkuRawData.map(b => new Date(b.tanggal).getFullYear());
    return Array.from(new Set(years)).sort((a, b) => b - a);
  }, [bkuRawData]);

  const chartData = useMemo(() => {
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      name: new Date(0, i).toLocaleString('id-ID', { month: 'short' }),
      Penerimaan: 0,
      Pengeluaran: 0
    }));

    bkuRawData.forEach(b => {
      const date = new Date(b.tanggal);
      if (date.getFullYear() === selectedYear) {
        const monthIndex = date.getMonth();
        if (b.jenis === "PENERIMAAN") {
          monthlyData[monthIndex].Penerimaan += Number(b.jumlah);
        } else if (b.jenis === "PENGELUARAN") {
          monthlyData[monthIndex].Pengeluaran += Number(b.jumlah);
        }
      }
    });

    return monthlyData;
  }, [bkuRawData, selectedYear]);

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
  if (!data || data.error) return <div className="p-8 text-center text-red-500">Gagal memuat data: {data?.error || "Unknown error"}</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg mb-6">
        <h1 className="text-3xl font-bold mb-2">
          Dashboard {data.namaKelompok}
        </h1>
        <p className="text-blue-100 opacity-90">Ringkasan keuangan dan pinjaman kelompok</p>
      </div>

      {isAdmin && kelompokList.length > 0 && (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2.5 rounded-lg">
              <Users className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Filter Data</h3>
              <p className="text-xs text-gray-500">Pilih kelompok untuk melihat ringkasan spesifik</p>
            </div>
          </div>
          
          <div className="w-full sm:w-auto min-w-[250px]">
            <select
              id="kelompokFilter"
              value={selectedKelompokId}
              onChange={(e) => setSelectedKelompokId(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-colors cursor-pointer"
            >
              {kelompokList.map(kel => (
                <option key={kel.id} value={kel.id}>{kel.nama_kelompok}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Saldo Akhir BKU"
          value={`Rp ${Number(data.saldoAkhir).toLocaleString('id-ID')}`}
          icon={<BarChart3 className="text-blue-500" size={24} />}
        />
        <StatCard
          title="Total Penerimaan"
          value={`Rp ${Number(data.totalPenerimaan).toLocaleString('id-ID')}`}
          icon={<Activity className="text-green-500" size={24} />}
        />
        <StatCard
          title="Total Pengeluaran"
          value={`Rp ${Number(data.totalPengeluaran).toLocaleString('id-ID')}`}
          icon={<CreditCard className="text-red-500" size={24} />}
        />
        <StatCard
          title="Pinjaman Beredar"
          value={`Rp ${Number(data.sisaPinjamanBeredar).toLocaleString('id-ID')}`}
          icon={<Users className="text-purple-500" size={24} />}
          subtitle={`${data.pinjamanAktif} Peminjam Aktif`}
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Grafik Keuangan BKU</h2>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <label htmlFor="yearFilter" className="text-sm font-medium text-gray-600">Pilih Tahun:</label>
            <select
              id="yearFilter"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
                tickFormatter={(value) => `Rp ${(value / 1000000).toFixed(0)}M`}
                dx={-10}
              />
              <Tooltip
                formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, undefined]}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line type="monotone" dataKey="Penerimaan" stroke="#10B981" strokeWidth={3} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="Pengeluaran" stroke="#EF4444" strokeWidth={3} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
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
