import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user || (user.level !== "up2k_admin" && user.level !== "superadmin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Baca query param tahun
    const { searchParams } = new URL(req.url);
    const tahunParam = searchParams.get("tahun");
    const tahun = tahunParam && tahunParam !== "all" ? parseInt(tahunParam) : null;

    // Konsolidasi BKU (all-time, untuk stat cards)
    const bku = await prisma.bukuKasUmum.findMany();
    let totalPenerimaan = 0;
    let totalPengeluaran = 0;

    bku.forEach(trx => {
      if (trx.jenis === "PENERIMAAN") totalPenerimaan += Number(trx.jumlah);
      if (trx.jenis === "PENGELUARAN") totalPengeluaran += Number(trx.jumlah);
    });

    const saldoBkuTotal = totalPenerimaan - totalPengeluaran;

    // Konsolidasi Pinjaman (all-time)
    const pinjaman = await prisma.pinjaman.findMany();
    let totalPinjaman = 0;
    let totalAngsuranPokok = 0;
    let totalJasaDiterima = 0;

    pinjaman.forEach(p => {
      totalPinjaman += Number(p.jumlah_pinjaman);
    });

    const angsuran = await prisma.angsuran.findMany();
    angsuran.forEach(a => {
      totalAngsuranPokok += Number(a.angsuran_pokok);
      totalJasaDiterima += Number(a.jasa);
    });

    const sisaPinjamanBeredar = totalPinjaman - totalAngsuranPokok;

    // Statistik Per Kelompok (difilter per tahun jika ada)
    const kelompokData = await prisma.kelompok.findMany({
      include: {
        bku: tahun
          ? {
              where: {
                tanggal: {
                  gte: new Date(`${tahun}-01-01T00:00:00.000Z`),
                  lte: new Date(`${tahun}-12-31T23:59:59.999Z`),
                },
              },
            }
          : true,
      },
    });

    const kelompokStats = kelompokData.map((k) => {
      let penerimaan = 0;
      let pengeluaran = 0;
      k.bku.forEach((b) => {
        if (b.jenis === "PENERIMAAN") penerimaan += Number(b.jumlah);
        if (b.jenis === "PENGELUARAN") pengeluaran += Number(b.jumlah);
      });
      return {
        id: k.id,
        nama_kelompok: k.nama_kelompok,
        penerimaan,
        pengeluaran,
      };
    });

    // Urutkan kelompokStats berdasarkan penerimaan tertinggi (Ranking)
    kelompokStats.sort((a, b) => b.penerimaan - a.penerimaan);

    return NextResponse.json({
      totalPenerimaan,
      totalPengeluaran,
      saldoBkuTotal,
      totalPinjaman,
      totalAngsuranPokok,
      sisaPinjamanBeredar,
      totalJasaDiterima,
      kelompokStats,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
