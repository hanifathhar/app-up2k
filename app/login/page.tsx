"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, CheckCircle, XCircle, User, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [pasword, setPasword] = useState("");
  const [showPasword, setShowPasword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState(new Date());

  const [notif, setNotif] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotif(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "programming-123",
        },
        body: JSON.stringify({
          username,
          pasword,
        }),
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        setNotif({
          type: "error",
          message:
            data.error ||
            "Login gagal, periksa kembali username atau password.",
        });
      } else {
        setNotif({
          type: "success",
          message: "Login berhasil! Mengarahkan ke dashboard...",
        });

        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      }
    } catch {
      setNotif({
        type: "error",
        message: "Gagal terhubung ke server.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gray-900">
      {/* BACKGROUND IMAGE - TEMA EKONOMI DESA */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/bg-desa.png"
          alt="Latar Belakang Ekonomi Desa"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Overlay untuk keterbacaan (Reddish dark theme to match UP2K) */}
        <div className="absolute inset-0 bg-gradient-to-t from-red-950/95 via-red-900/80 to-red-950/60 backdrop-blur-[2px]" />
      </div>

      {/* FORM CARD - CENTERED */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-[28rem] px-6 py-10"
      >
        <div
          className="
            w-full
            bg-white/95
            backdrop-blur-md
            rounded-[2rem]
            shadow-[0_30px_60px_rgba(0,0,0,0.3)]
            border
            border-white/20
            p-8
            sm:p-10
            flex
            flex-col
          "
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[1.5rem] bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-3xl sm:text-4xl font-black shadow-lg shadow-red-200 mb-5">
                UP
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Aplikasi UP2K
              </h1>
              <p className="text-gray-500 mt-2 text-sm sm:text-base font-medium">
                Usaha Peningkatan Pendapatan Keluarga
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-gray-700 font-bold">Username</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <User size={20} />
                </div>
                <Input
                  id="username"
                  type="text"
                  placeholder="Masukkan username Anda"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="pl-11 h-14 rounded-xl bg-gray-50/80 border-gray-200 focus:bg-white focus:border-red-500 focus:ring-red-500 transition-all text-base"
                />
              </div>
            </div>

            <div className="space-y-1.5 relative">
              <Label htmlFor="password" className="text-gray-700 font-bold">Password</Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Lock size={20} />
                </div>
                <Input
                  id="password"
                  type={showPasword ? "text" : "password"}
                  placeholder="Masukkan password Anda"
                  value={pasword}
                  onChange={(e) => setPasword(e.target.value)}
                  required
                  className="pl-11 pr-12 h-14 rounded-xl bg-gray-50/80 border-gray-200 focus:bg-white focus:border-red-500 focus:ring-red-500 transition-all text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPasword(!showPasword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-red-600 transition-colors"
                >
                  {showPasword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="
                  w-full
                  h-14
                  rounded-xl
                  bg-gradient-to-r
                  from-red-600
                  to-red-700
                  hover:from-red-700
                  hover:to-red-800
                  active:scale-[0.98]
                  text-white
                  font-bold
                  text-lg
                  shadow-xl
                  shadow-red-600/20
                  transition-all
                  duration-200
                "
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Memproses...
                  </div>
                ) : (
                  "Masuk"
                )}
              </Button>
            </div>
          </form>

          {/* Footer Card */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500 font-medium">
              © {new Date().getFullYear()} Aplikasi UP2K<br/>
              Developed by Team TI Kab. Tapanuli Selatan
            </p>
          </div>
        </div>
      </motion.div>

      {/* Floating Time - Bottom Right Corner (Visible on Desktop mostly, or centered at bottom on mobile) */}
      <div className="absolute bottom-6 w-full text-center lg:w-auto lg:right-8 lg:bottom-8 lg:text-right z-10">
        <div className="inline-block px-5 py-2.5 rounded-xl bg-black/30 backdrop-blur-md border border-white/10 text-white shadow-2xl">
          <p className="text-lg font-bold tracking-widest text-red-100">
            {mounted && time.toLocaleTimeString("id-ID")}
          </p>
          <p className="text-xs text-gray-300 mt-0.5 font-medium">
            {mounted &&
              time.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
          </p>
        </div>
      </div>

      {/* Notifikasi */}
      <AnimatePresence>
        {notif && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`absolute top-8 left-1/2 -translate-x-1/2 w-[90%] max-w-sm px-4 py-3 rounded-2xl shadow-2xl text-white flex items-center gap-3 z-50 ${
              notif.type === "success" ? "bg-emerald-500" : "bg-red-500"
            }`}
          >
            {notif.type === "success" ? (
              <CheckCircle size={20} className="shrink-0" />
            ) : (
              <XCircle size={20} className="shrink-0" />
            )}
            <span className="text-sm font-medium">{notif.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
