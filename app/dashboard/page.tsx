"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, BarChart3, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me");
        if (res.ok) {
          const data = await res.json();
          setRole(data.user?.level || null);
          setName(data.user?.nama || "Pengguna");
        }
      } catch (error) {
        console.error("Gagal mengambil data user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="animate-spin text-red-600" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="bg-gradient-to-r from-red-700 to-red-500 rounded-2xl p-8 text-white shadow-lg mb-8">
        <h1 className="text-3xl font-bold mb-2">Selamat Datang, {name}!</h1>
        <p className="text-red-100">
          Di Sistem Informasi Usaha Peningkatan Pendapatan Keluarga (UP2K)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {role === "up2k_kelompok" || role === "superadmin" ? (
          <div 
            onClick={() => router.push("/dashboard/kelompok")}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-red-200 transition-all group"
          >
            <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center text-red-600 mb-4 group-hover:bg-red-600 group-hover:text-white transition-colors">
              <Users size={28} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Dashboard Kelompok</h2>
            <p className="text-gray-500 text-sm">
              Kelola Buku Kas Umum (BKU), catat penerimaan/pengeluaran, dan manajemen data pinjaman serta angsuran kelompok Anda.
            </p>
          </div>
        ) : null}

        {role === "up2k_admin" || role === "superadmin" ? (
          <div 
            onClick={() => router.push("/dashboard/admin/up2k")}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-red-200 transition-all group"
          >
            <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <BarChart3 size={28} />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Konsolidasi Admin</h2>
            <p className="text-gray-500 text-sm">
              Lihat rangkuman total saldo, perputaran pinjaman, dan laporan konsolidasi dari seluruh kelompok UP2K yang terdaftar.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}