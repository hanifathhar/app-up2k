import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const body = await req.json();
    const { tanggal, angsuran_pokok, jasa, iuran, simpanan } = body;

    const existingAngsuran = await prisma.angsuran.findUnique({
      where: { id },
      include: { pinjaman: true }
    });

    if (!existingAngsuran) {
      return NextResponse.json({ error: "Angsuran tidak ditemukan" }, { status: 404 });
    }

    if (user.level === "up2k_kelompok" && existingAngsuran.pinjaman.kelompokId !== user.kelompokId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updated = await prisma.angsuran.update({
      where: { id },
      data: {
        tanggal: tanggal ? new Date(tanggal) : existingAngsuran.tanggal,
        angsuran_pokok: angsuran_pokok !== undefined ? Number(angsuran_pokok) : existingAngsuran.angsuran_pokok,
        jasa: jasa !== undefined ? Number(jasa) : existingAngsuran.jasa,
        iuran: iuran !== undefined ? Number(iuran) : existingAngsuran.iuran,
        simpanan: simpanan !== undefined ? Number(simpanan) : existingAngsuran.simpanan,
      }
    });

    // Check if LUNAS needs to be updated
    const allAngsuran = await prisma.angsuran.findMany({
      where: { pinjamanId: existingAngsuran.pinjamanId }
    });
    
    let totalTerbayar = 0;
    for (const a of allAngsuran) {
      totalTerbayar += Number(a.angsuran_pokok);
    }
    
    const isLunas = (Number(existingAngsuran.pinjaman.jumlah_pinjaman) - totalTerbayar) <= 0;
    await prisma.pinjaman.update({
      where: { id: existingAngsuran.pinjamanId },
      data: { status: isLunas ? "LUNAS" : "BELUM_LUNAS" }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const existingAngsuran = await prisma.angsuran.findUnique({
      where: { id },
      include: { pinjaman: true }
    });

    if (!existingAngsuran) {
      return NextResponse.json({ error: "Angsuran tidak ditemukan" }, { status: 404 });
    }

    if (user.level === "up2k_kelompok" && existingAngsuran.pinjaman.kelompokId !== user.kelompokId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.angsuran.delete({ where: { id } });

    // Check if LUNAS needs to be reverted
    const allAngsuran = await prisma.angsuran.findMany({
      where: { pinjamanId: existingAngsuran.pinjamanId }
    });
    
    let totalTerbayar = 0;
    for (const a of allAngsuran) {
      totalTerbayar += Number(a.angsuran_pokok);
    }
    
    const isLunas = (Number(existingAngsuran.pinjaman.jumlah_pinjaman) - totalTerbayar) <= 0;
    await prisma.pinjaman.update({
      where: { id: existingAngsuran.pinjamanId },
      data: { status: isLunas ? "LUNAS" : "BELUM_LUNAS" }
    });

    return NextResponse.json({ message: "Angsuran berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
