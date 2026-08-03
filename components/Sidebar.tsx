"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Home,
  ShoppingCart,
  Package,
  Tags,
  Boxes,
  Users,
  Truck,
  PackagePlus,
  Receipt,
  BarChart3,
  User,
  UserCog,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import {
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  active?: string;
}



export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  active = "dashboard",
}: SidebarProps) {
  const router = useRouter();

  const [role, setRole] = useState<
    "superadmin" | "admin" | "kasir" | "up2k_admin" | "up2k_kelompok" | null
  >(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await fetch("/api/me");
        const data = await res.json();

        setRole(data.user?.level || "superadmin");
      } catch (error) {
        console.error("Gagal ambil role:", error);
      }
    };

    fetchRole();
  }, []);



  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/login");
  };

  const [openMenu, setOpenMenu] = useState<string | null>(
    "Dashboard"
  );

 const allMenus = [
  {
    title: "Dashboard",
    icon: <Home size={18} />,
    href: "/dashboard",
    roles: ["superadmin", "admin", "kasir"],
  },


  {
    title: "UP2K Kelompok",
    icon: <Users size={18} />,
    roles: ["superadmin", "up2k_admin", "up2k_kelompok"],
    children: [
      {
        label: "Dashboard Kelompok",
        href: "/dashboard/kelompok",
      },
      {
        label: "Buku Kas Umum",
        href: "/dashboard/kelompok/bku",
      },
      {
        label: "Pinjaman & Angsuran",
        href: "/dashboard/kelompok/pinjaman",
      },
    ],
  },
  {
    title: "UP2K Admin",
    icon: <BarChart3 size={18} />,
    roles: ["superadmin", "up2k_admin"],
    children: [
      {
        label: "Konsolidasi",
        href: "/dashboard/admin/up2k",
      },
      {
        label: "Manajemen Kelompok",
        href: "/dashboard/admin/kelompok",
      },
      {
        label: "Manajemen Pengguna",
        href: "/dashboard/admin/pengguna",
      },
    ],
  },
];

  const menuItems = role
    ? allMenus.filter((item) =>
        item.roles.includes(role)
      )
    : [];

  return (
    <>
      {/* Overlay Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40
          w-72
          bg-white
          border-r border-red-100
          shadow-xl
          flex flex-col
          justify-between
          transform transition-all duration-300
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }
        `}
      >
        <div>
          {/* Header Sidebar */}
          <div className="relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-white"></div>

            <div className="bg-gradient-to-r from-red-700 via-red-600 to-red-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg overflow-hidden">
                        <span className="text-red-600 font-black text-xl">
                          UP
                        </span>
                    </div>

                    <div>
                      <h2 className="font-bold text-lg leading-tight">
                        Aplikasi UP2K
                      </h2>

                      <p className="text-xs text-red-100">
                        Usaha Peningkatan Pendapatan Keluarga
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  className="md:hidden"
                  onClick={() =>
                    setSidebarOpen(false)
                  }
                >
                  <X size={22} />
                </button>
              </div>
            </div>
          </div>

          {/* Menu */}
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <div key={item.title}>
                {item.children ? (
                  <>
                    <button
                      onClick={() =>
                        setOpenMenu(
                          openMenu === item.title
                            ? null
                            : item.title
                        )
                      }
                      className="
                        flex items-center justify-between
                        w-full
                        px-4 py-3
                        rounded-xl
                        hover:bg-red-50
                      "
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        {item.title}
                      </div>

                      {openMenu === item.title ? (
                        <ChevronDown size={18} />
                      ) : (
                        <ChevronRight size={18} />
                      )}
                    </button>

                    {openMenu === item.title && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <button
                            key={child.href}
                            onClick={() =>
                              router.push(child.href)
                            }
                            className="
                              block
                              w-full
                              text-left
                              px-3 py-2
                              rounded-lg
                              text-sm
                              hover:bg-red-100
                            "
                          >
                            {child.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => router.push(item.href)}
                    className="
                      flex items-center gap-3
                      w-full px-4 py-3
                      rounded-xl
                      hover:bg-red-50
                    "
                  >
                    {item.icon}
                    {item.title}
                  </button>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-red-100">
          <div className="mb-4 bg-red-50 rounded-2xl p-4">
            <p className="text-xs text-gray-500">
              Status Sistem
            </p>

            <p className="font-semibold text-red-700">
              Online & Aktif
            </p>
          </div>

         

          <p className="text-center text-xs text-gray-400 mt-4">
            © 2026 Aplikasi UP2K
          </p>
        </div>
      </aside>
    </>
  );
}