import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(req);
    if (!user || (user.level !== "up2k_admin" && user.level !== "superadmin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { nama_kelompok, desa, ketua } = body;

    if (!nama_kelompok) {
      return NextResponse.json({ error: "Nama kelompok wajib diisi" }, { status: 400 });
    }

    const updatedKelompok = await prisma.kelompok.update({
      where: { id: Number(id) },
      data: {
        nama_kelompok,
        desa,
        ketua,
      },
    });

    return NextResponse.json(updatedKelompok);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(req);
    if (!user || (user.level !== "up2k_admin" && user.level !== "superadmin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Cek apakah ada transaksi BKU atau Pinjaman yang terkait
    const bkuCount = await prisma.bukuKasUmum.count({
      where: { kelompokId: Number(id) }
    });

    const pinjamanCount = await prisma.pinjaman.count({
      where: { kelompokId: Number(id) }
    });

    if (bkuCount > 0 || pinjamanCount > 0) {
      return NextResponse.json(
        { error: "Kelompok tidak dapat dihapus karena sudah memiliki data transaksi (BKU atau Pinjaman)." },
        { status: 400 }
      );
    }

    // Jika tidak ada transaksi, hapus kelompok
    await prisma.kelompok.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "Kelompok berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
