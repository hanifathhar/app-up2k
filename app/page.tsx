"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
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

  const [toko, setToko] = useState<{
    nama: string;
    logo: string | null;
    alamat: string | null;
  } | null>(null);

  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);



const loadToko = async () => {
    try {
      const res = await fetch("/api/toko", {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "programming-123",
        },
      });

      if (!res.ok) throw new Error();

      const result = await res.json();

      setToko(result.data ?? result);
    } catch (error) {
      console.error(error);
    }
  };

   useEffect(() => {
    loadToko();
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
    <div className="min-h-screen flex bg-red-50 overflow-hidden">
      {/* KIRI */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-[45%] flex items-center justify-center px-6 py-10 lg:px-16 relative"
      >
        <div
          className="
            w-full
            max-w-md
            bg-white
            rounded-[32px]
            shadow-[0_25px_80px_rgba(220,38,38,0.15)]
            border
            border-red-100
            p-8
            md:p-10
          "
        >
          {/* Heading */}
          <div className="text-center mb-4">
            <div className="flex flex-col items-center">

              {toko?.logo ? (
                <Image
                  src={toko.logo}
                  alt={toko.nama}
                  width={70}
                  height={70}
                  className="object-contain rounded-xl mb-3"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-red-600 flex items-center justify-center text-white text-3xl font-bold mb-3">
                  SP
                </div>
              )}

              <h1 className="text-2xl font-bold text-red-600">
                {toko?.nama ?? "SMART POS"}
              </h1>

            </div>
          </div>

          {/* Timer */}
          <div className="text-center mb-8">
            <div className="inline-block px-5 py-3 rounded-2xl bg-red-50 border border-red-200">
              <p className="text-2xl font-bold text-red-700">
                {mounted && time.toLocaleTimeString("id-ID")}
              </p>

              <p className="text-xs text-gray-600">
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="username">Username</Label>

              <Input
                id="username"
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-2 h-12 rounded-xl"
              />
            </div>

            <div className="relative">
              <Label htmlFor="password">Password</Label>

              <Input
                id="password"
                type={showPasword ? "text" : "password"}
                placeholder="Masukkan password"
                value={pasword}
                onChange={(e) => setPasword(e.target.value)}
                required
                className="mt-2 h-12 rounded-xl pr-12"
              />

              <button
                type="button"
                onClick={() => setShowPasword(!showPasword)}
                className="absolute right-4 top-11 text-gray-500 hover:text-red-600"
              >
                {showPasword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="
                w-full
                h-12
                rounded-xl
                bg-gradient-to-r
                from-red-700
                to-red-500
                hover:scale-[1.02]
                text-white
                font-semibold
                shadow-lg
                transition-all
                duration-300
              "
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memproses...
                </div>
              ) : (
                "Masuk ke Dashboard"
              )}
            </Button>
          </form>

          <div className="text-center mt-6">
             <footer className="absolute bottom-5 left-0 right-0 text-center">
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} SMART POS
              </p>
              <p className="text-xs text-gray-400">
                Developed by Team TI Kabupaten Tapanuli Selatan
              </p>
              <p className="text-xs text-gray-400">
                All Rights Reserved
              </p>
            </footer>
          </div>
        </div>

        {/* Notifikasi */}
        <AnimatePresence>
          {notif && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className={`fixed bottom-5 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl shadow-xl text-white flex items-center gap-2 z-50 ${
                notif.type === "success"
                  ? "bg-green-600"
                  : "bg-red-800"
              }`}
            >
              {notif.type === "success" ? (
                <CheckCircle size={18} />
              ) : (
                <XCircle size={18} />
              )}
              {notif.message}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* KANAN */}
      {/* RIGHT HERO */}

<motion.div
  initial={{ opacity:0, x:60 }}
  animate={{ opacity:1,x:0 }}
  transition={{duration:.8}}
  className="
    hidden
    lg:flex
    flex-1
    relative
    overflow-hidden
    bg-gradient-to-br
    from-red-950
    via-red-700
    to-red-500
  "
>


{/* Decorative Circle */}

<div
className="
absolute
-right-40
-top-40
w-[500px]
h-[500px]
rounded-full
bg-white/10
blur-3xl
"
/>


<div
className="
absolute
-left-40
-bottom-20
w-[350px]
h-[350px]
rounded-full
bg-red-900/40
blur-3xl
"
/>



{/* IMAGE */}

<Image
  src="/images/bg1.png"
  alt="POS Dashboard"
  fill
  priority
  className="object-contain object-center"
/>



{/* Dark Gradient */}

<div
className="
absolute
inset-0
bg-gradient-to-r
from-red-950/95
via-red-800/50
to-transparent
"
/>



{/* TOP LINE */}

<div
className="
absolute
top-0
left-0
w-full
h-2
bg-white
z-20
"
/>

<div
className="
absolute
top-2
left-0
w-full
h-2
bg-red-400
z-20
"
/>



{/* CONTENT */}

<div
className="
relative
z-10
px-14
max-w-xl
flex
flex-col
justify-center
"
>


{/* LOGO CARD */}

<div
className="
flex
items-center
gap-5
mb-12
"
>

<div
className="
w-20
h-20
rounded-3xl
bg-white/90
backdrop-blur
shadow-2xl
flex
items-center
justify-center
"
>

{
toko?.logo ?

<Image
src={toko.logo}
alt="logo"
width={60}
height={60}
className="object-contain"
/>

:

<span
className="
text-red-700
font-black
text-3xl
"
>
SP
</span>

}

</div>



<div>

<h1
className="
text-4xl
font-black
text-white
"
>
{toko?.nama ?? "SMART POS"}
</h1>


<p
className="
text-red-100
text-sm
"
>
{toko?.alamat ?? "Smart Business Solution"}
</p>


</div>


</div>









{/* FEATURE CARD */}

<div
className="
mt-10
flex
gap-4
"
>


<div
className="
bg-white/20
backdrop-blur-md
border
border-white/30
rounded-2xl
px-5
py-4
text-white
"
>

<p className="text-2xl font-bold">
99%
</p>

<p className="text-xs">
Akurat
</p>


</div>



<div
className="
bg-white/20
backdrop-blur-md
border
border-white/30
rounded-2xl
px-5
py-4
text-white
"
>

<p className="text-2xl font-bold">
Realtime
</p>

<p className="text-xs">
Monitoring
</p>


</div>


</div>



</div>



</motion.div>
    </div>
  );
}