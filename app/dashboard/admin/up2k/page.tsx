"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart3, Users, CreditCard, Activity, Trophy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function UP2KAdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tahun, setTahun] = useState<string>("all");
  const [chartWidth, setChartWidth] = useState(600);
  const chartRef = useRef<HTMLDivElement>(null);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  // Responsive: track container width
  useEffect(() => {
    const update = () => {
      if (chartRef.current) setChartWidth(chartRef.current.offsetWidth);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const isMobile = chartWidth < 540;
  const yAxisWidth = isMobile ? Math.min(chartWidth * 0.42, 140) : 185;
  const chartMargin = { top: 5, right: isMobile ? 8 : 30, left: 0, bottom: 5 };

  // Custom YAxis tick: truncate on mobile
  const CustomYAxisTick = ({ x, y, payload }: any) => {
    const maxLen = isMobile ? 18 : 38;
    const label = payload.value.length > maxLen
      ? payload.value.slice(0, maxLen - 1) + '…'
      : payload.value;
    return (
      <text
        x={x}
        y={y}
        dy={4}
        textAnchor="end"
        fill="#374151"
        fontSize={isMobile ? 10 : 12}
        fontWeight={500}
      >
        {label}
      </text>
    );
  };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/up2k/konsolidasi?tahun=${tahun}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [tahun]);

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

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col max-h-[320px]">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="text-yellow-500" size={20} />
            <h2 className="font-semibold text-gray-800">Ranking Pokla Terbaik</h2>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {data.kelompokStats?.map((k: any, index: number) => (
              <div key={k.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-50 hover:bg-red-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-200 text-gray-700' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-red-50 text-red-600'}`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 line-clamp-1">{k.nama_kelompok}</p>
                    <p className="text-xs text-gray-500">Penerimaan Total</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-green-600 text-sm">Rp {k.penerimaan.toLocaleString()}</p>
                </div>
              </div>
            ))}
            {(!data.kelompokStats || data.kelompokStats.length === 0) && (
              <p className="text-center text-gray-500 text-sm mt-10">Belum ada data kelompok.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-semibold text-gray-800">
            Tren Penerimaan & Pengeluaran Per Kelompok {tahun === 'all' ? '(All Time)' : `(${tahun})`}
          </h2>
          <select
            value={tahun}
            onChange={(e) => setTahun(e.target.value)}
            className="border border-gray-300 rounded-lg text-sm shadow-sm px-3 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="all">Semua Tahun</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div
          ref={chartRef}
          className="w-full overflow-y-auto"
          style={{ height: Math.max(isMobile ? 300 : 400, (data.kelompokStats?.length || 1) * (isMobile ? 60 : 76) + 60) }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data.kelompokStats}
              margin={chartMargin}
              barCategoryGap="28%"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
              <XAxis
                type="number"
                tickFormatter={(val) =>
                  isMobile
                    ? `${(val / 1000000).toFixed(0)}M`
                    : `Rp ${(val / 1000000).toFixed(0)}M`
                }
                tick={{ fill: '#6b7280', fontSize: isMobile ? 9 : 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="nama_kelompok"
                tick={<CustomYAxisTick />}
                axisLine={false}
                tickLine={false}
                width={yAxisWidth}
              />
              <Tooltip
                formatter={(val: any) => typeof val === 'number' ? `Rp ${val.toLocaleString('id-ID')}` : val}
                cursor={{ fill: '#f3f4f6' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: isMobile ? 11 : 13 }}
              />
              <Legend wrapperStyle={{ paddingBottom: '10px', fontSize: isMobile ? 11 : 13 }} />
              <Bar dataKey="penerimaan" name="Penerimaan" fill="#22c55e" radius={[0, 4, 4, 0]} maxBarSize={isMobile ? 18 : 26} />
              <Bar dataKey="pengeluaran" name="Pengeluaran" fill="#ef4444" radius={[0, 4, 4, 0]} maxBarSize={isMobile ? 18 : 26} />
            </BarChart>
          </ResponsiveContainer>
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
