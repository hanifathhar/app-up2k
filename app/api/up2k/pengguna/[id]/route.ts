import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(req);
    if (!user || (user.level !== "superadmin" && user.level !== "up2k_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { nama, no_tlp, username, pasword, level, kelompokId } = body;

    if (!nama || !username || !level) {
      return NextResponse.json({ error: "Nama, username, dan level wajib diisi" }, { status: 400 });
    }

    // Cek apakah username sudah ada dan digunakan oleh pengguna lain
    const existingUser = await prisma.pengguna.findFirst({
      where: { 
        username,
        id: { not: Number(id) }
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Username sudah digunakan oleh akun lain" }, { status: 400 });
    }

    const updateData: any = {
      nama,
      no_tlp: no_tlp || "",
      username,
      level,
      kelompokId: level === "up2k_kelompok" && kelompokId ? Number(kelompokId) : null,
    };

    // Jika password diisi, update password
    if (pasword && pasword.trim() !== "") {
      updateData.pasword = await bcrypt.hash(pasword, 10);
    }

    const updatedPengguna = await prisma.pengguna.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        kelompok: true
      }
    });

    const { pasword: _, ...safePengguna } = updatedPengguna;
    return NextResponse.json(safePengguna);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(req);
    if (!user || (user.level !== "superadmin" && user.level !== "up2k_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Optional: mencegah pengguna menghapus dirinya sendiri
    if (user.id === Number(id)) {
      return NextResponse.json({ error: "Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif." }, { status: 400 });
    }

    await prisma.pengguna.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "Pengguna berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
