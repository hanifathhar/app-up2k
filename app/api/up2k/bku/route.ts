import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const paramKelompokId = searchParams.get("kelompokId");
    
    let kelompokId = user.kelompokId;

    if (user.level === "up2k_admin" || user.level === "superadmin") {
      if (paramKelompokId) {
        kelompokId = parseInt(paramKelompokId);
      } else {
        // Admin must provide kelompokId to see BKU, or we return all? 
        // BKU usually belongs to a specific kelompok. Let's return all if no kelompokId provided, 
        // but normally admin looks per kelompok.
      }
    }

    const whereClause = kelompokId ? { kelompokId } : {};

    const bku = await prisma.bukuKasUmum.findMany({
      where: whereClause,
      orderBy: { tanggal: 'asc' },
      include: {
        kelompok: { select: { nama_kelompok: true } }
      }
    });

    return NextResponse.json(bku);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    let { kelompokId, tanggal, uraian, jenis, jumlah } = body;

    // Default to user's kelompokId if they are up2k_kelompok
    if (user.level === "up2k_kelompok") {
      kelompokId = user.kelompokId;
    }

    if (!kelompokId || !tanggal || !uraian || !jenis || jumlah === undefined) {
      return NextResponse.json({ error: "Semua field wajib diisi" }, { status: 400 });
    }

    // Ensure kelompokId is an integer (may come as string from form)
    kelompokId = parseInt(String(kelompokId), 10);

    // Get the latest balance (saldo) for the kelompok
    const lastBku = await prisma.bukuKasUmum.findFirst({
      where: { kelompokId },
      orderBy: [ { tanggal: 'desc' }, { id: 'desc' } ]
    });

    let currentSaldo = lastBku ? Number(lastBku.saldo) : 0;
    const amount = Number(jumlah);

    if (jenis === "PENERIMAAN") {
      currentSaldo += amount;
    } else if (jenis === "PENGELUARAN") {
      currentSaldo -= amount;
    } else {
      return NextResponse.json({ error: "Jenis transaksi tidak valid" }, { status: 400 });
    }

    const newBku = await prisma.bukuKasUmum.create({
      data: {
        kelompokId,
        tanggal: new Date(tanggal),
        uraian,
        jenis,
        jumlah: amount,
        saldo: currentSaldo,
      },
    });

    return NextResponse.json(newBku, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
