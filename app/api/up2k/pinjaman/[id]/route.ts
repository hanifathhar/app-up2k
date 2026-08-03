import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = user.level === "admin" || user.level === "up2k_admin" || user.level === "superadmin";

    if (user.level !== "up2k_kelompok" && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const body = await req.json();
    const { nama_peminjam, keperluan_usaha, tanggal_pinjam, jumlah_pinjaman, lama_angsuran, jasa } = body;

    const existing = await prisma.pinjaman.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    if (!isAdmin && existing.kelompokId !== user.kelompokId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.pinjaman.update({
      where: { id },
      data: {
        nama_peminjam,
        keperluan_usaha: keperluan_usaha || null,
        tanggal_pinjam: new Date(tanggal_pinjam),
        jumlah_pinjaman: Number(jumlah_pinjaman),
        lama_angsuran: Number(lama_angsuran),
        jasa: Number(jasa || 0),
      }
    });

    return NextResponse.json({ message: "Updated successfully" });
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

    const isAdmin = user.level === "admin" || user.level === "up2k_admin" || user.level === "superadmin";

    if (user.level !== "up2k_kelompok" && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    const existing = await prisma.pinjaman.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    if (!isAdmin && existing.kelompokId !== user.kelompokId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Angsuran will be deleted automatically due to Cascade
    await prisma.pinjaman.delete({ where: { id } });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

