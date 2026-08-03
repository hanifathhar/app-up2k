import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { pinjamanId, tanggal, angsuran_pokok, jasa, iuran, simpanan } = body;

    if (!pinjamanId || !tanggal || angsuran_pokok === undefined) {
      return NextResponse.json({ error: "Data angsuran tidak lengkap" }, { status: 400 });
    }

    const parsedPinjamanId = parseInt(pinjamanId);
    const parsedAngsuranPokok = Number(angsuran_pokok);

    if (isNaN(parsedPinjamanId) || isNaN(parsedAngsuranPokok) || parsedAngsuranPokok <= 0) {
      return NextResponse.json({ error: "Nominal angsuran tidak valid" }, { status: 400 });
    }

    // Gunakan Transaksi untuk menjaga konsistensi data
    const result = await prisma.$transaction(async (tx) => {
      // 1. Ambil data pinjaman & relasi angsuran di dalam transaksi
      const pinjaman = await tx.pinjaman.findUnique({
        where: { id: parsedPinjamanId },
        include: { angsuran: true }
      });

      if (!pinjaman) {
        throw new Error("Pinjaman tidak ditemukan");
      }

      if (pinjaman.status === "LUNAS") {
        throw new Error("Pinjaman ini sudah lunas");
      }

      if (user.level === "up2k_kelompok" && pinjaman.kelompokId !== user.kelompokId) {
        throw new Error("Unauthorized");
      }

      // 2. Hitung sisa pinjaman saat ini
      let sisa_pinjaman = Number(pinjaman.jumlah_pinjaman);
      for (const ang of pinjaman.angsuran) {
        sisa_pinjaman -= Number(ang.angsuran_pokok);
      }

      // Validasi agar angsuran pokok tidak melebihi sisa pinjaman
      if (parsedAngsuranPokok > sisa_pinjaman) {
        throw new Error(`Angsuran pokok melebihi sisa pinjaman (${sisa_pinjaman})`);
      }

      sisa_pinjaman -= parsedAngsuranPokok;
      const angsuran_ke = pinjaman.angsuran.length + 1;

      // 3. Buat angsuran baru
      const newAngsuran = await tx.angsuran.create({
        data: {
          pinjamanId: parsedPinjamanId,
          tanggal: new Date(tanggal),
          angsuran_ke,
          angsuran_pokok: parsedAngsuranPokok,
          jasa: Number(jasa || 0),
          // Hapus baris di bawah ini jika kolom 'iuran' belum ada di schema.prisma Anda:
          iuran: Number(iuran || 0),
          simpanan: Number(simpanan || 0),
          sisa_pinjaman: sisa_pinjaman,
        },
      });

      // 4. Update status pinjaman jika lunas
      if (sisa_pinjaman <= 0) {
        await tx.pinjaman.update({
          where: { id: parsedPinjamanId },
          data: { status: "LUNAS" }
        });
      }

      return newAngsuran;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    // Tangkap pesan error kustom dari dalam transaksi
    const status = error.message === "Pinjaman tidak ditemukan" ? 404 :
      error.message === "Unauthorized" ? 401 :
        error.message.includes("melebihi") || error.message.includes("tidak valid") ? 400 : 500;

    return NextResponse.json({ error: error.message }, { status });
  }
}