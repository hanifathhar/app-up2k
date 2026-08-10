import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user || (user.level !== "up2k_admin" && user.level !== "superadmin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const kelompok = await prisma.kelompok.findMany({
      orderBy: { nama_kelompok: 'asc' }
    });

    return NextResponse.json(kelompok);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user || (user.level !== "up2k_admin" && user.level !== "superadmin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { nama_kelompok, desa, ketua, bendahara } = body;

    if (!nama_kelompok) {
      return NextResponse.json({ error: "Nama kelompok wajib diisi" }, { status: 400 });
    }

    const newKelompok = await prisma.kelompok.create({
      data: {
        nama_kelompok,
        desa,
        ketua,
        bendahara,
      },
    });

    return NextResponse.json(newKelompok, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
