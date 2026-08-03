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
      }
    }

    const whereClause = kelompokId ? { kelompokId } : {};

    const pinjaman = await prisma.pinjaman.findMany({
      where: whereClause,
      orderBy: { tanggal_pinjam: 'desc' },
      include: {
        kelompok: { select: { nama_kelompok: true } },
        angsuran: { orderBy: { angsuran_ke: 'asc' } }
      }
    });

    return NextResponse.json(pinjaman);
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
    let { kelompokId, nama_peminjam, keperluan_usaha, tanggal_pinjam, jumlah_pinjaman, lama_angsuran, jasa } = body;

    // Default to user's kelompokId if they are up2k_kelompok
    if (user.level === "up2k_kelompok") {
      kelompokId = user.kelompokId;
    }

    if (!kelompokId || !nama_peminjam || !tanggal_pinjam || !jumlah_pinjaman || !lama_angsuran) {
      return NextResponse.json({ error: "Data pinjaman tidak lengkap" }, { status: 400 });
    }

    const newPinjaman = await prisma.pinjaman.create({
      data: {
        kelompokId,
        nama_peminjam,
        keperluan_usaha: keperluan_usaha || null,
        tanggal_pinjam: new Date(tanggal_pinjam),
        jumlah_pinjaman: Number(jumlah_pinjaman),
        lama_angsuran: Number(lama_angsuran),
        jasa: Number(jasa || 0),
        status: "BELUM_LUNAS"
      },
    });

    return NextResponse.json(newPinjaman, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
