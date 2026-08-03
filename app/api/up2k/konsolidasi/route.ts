import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user || (user.level !== "up2k_admin" && user.level !== "superadmin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Konsolidasi BKU
    const bku = await prisma.bukuKasUmum.findMany();
    let totalPenerimaan = 0;
    let totalPengeluaran = 0;
    
    bku.forEach(trx => {
      if (trx.jenis === "PENERIMAAN") totalPenerimaan += Number(trx.jumlah);
      if (trx.jenis === "PENGELUARAN") totalPengeluaran += Number(trx.jumlah);
    });

    const saldoBkuTotal = totalPenerimaan - totalPengeluaran;

    // Konsolidasi Pinjaman
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

    return NextResponse.json({
      totalPenerimaan,
      totalPengeluaran,
      saldoBkuTotal,
      totalPinjaman,
      totalAngsuranPokok,
      sisaPinjamanBeredar,
      totalJasaDiterima
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
