"use client";

import { Menu, LogOut, User, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";



export default function Header({
  user,
  onMenuClick,
  onLogout,
}: {
  user: {
    nama: string;
    no_tlp?: string;
    username?: string;
    level?: string;
    kelompok?: {
      nama_kelompok: string;
    } | null;
  } | null;
  onMenuClick: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();



  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-red-100 shadow-sm">
      <div className="px-6 py-3 flex items-center justify-between">
        {/* Kiri */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden text-red-700"
            onClick={onMenuClick}
          >
            <Menu size={24} />
          </button>

          <div>
            <h1 className="font-bold text-xl text-red-700">
              {user?.level === 'admin' ? 'Sistem Manajemen Administrasi, Rekap dan Tracking' : user?.kelompok?.nama_kelompok || 'Sistem Manajemen Administrasi, Rekap dan Tracking'}
            </h1>

            <p className="text-xs text-gray-500 hidden md:block">
              Desa Sugi Kecamatan Marancar
            </p>
          </div>
        </div>

        {/* Tengah */}
        <div className="hidden lg:block text-center">

        </div>

        {/* Kanan */}
        <div className="relative">
          <button
            className="flex items-center gap-3"
            onClick={() => setOpen(!open)}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-800">
                {user?.nama}
              </p>
            </div>

            <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold border border-red-200">
              {user?.nama?.charAt(0).toUpperCase() || "U"}
            </div>
          </button>

          {/* Dropdown */}
          {open && (
            <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-red-100 overflow-hidden z-50">

              {/* Header */}
              <div className="bg-gradient-to-r from-red-700 to-red-500 p-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-white text-red-600 flex items-center justify-center font-bold text-xl">
                    {user?.nama?.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg">
                      {user?.nama}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Menu */}
              <div className="p-3 space-y-2">

                {/* Profil */}
                <button
                  onClick={() => router.push("/profile")}
                  className="
                    w-full
                    flex
                    items-center
                    gap-3
                    px-4
                    py-3
                    rounded-xl
                    hover:bg-red-50
                    text-gray-700
                    transition
                  "
                >
                  <UserCircle size={20} />
                  <span>Profil Saya</span>
                </button>


                <hr />

                {/* Logout */}
                <button
                  onClick={onLogout}
                  className="
                    w-full
                    flex
                    items-center
                    gap-3
                    px-4
                    py-3
                    rounded-xl
                    hover:bg-red-50
                    text-gray-700
                    transition
                  "
                >
                  <LogOut size={18} />
                  Logout
                </button>

              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}