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

    // Ambil semua angsuran yang memiliki iuran > 0, beserta data pinjaman
    const angsuranList = await prisma.angsuran.findMany({
      where: {
        pinjaman: whereClause,
      },
      include: {
        pinjaman: {
          include: {
            kelompok: { select: { nama_kelompok: true } },
          },
        },
      },
      orderBy: { tanggal: "desc" },
    });

    return NextResponse.json(angsuranList);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
