import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    // Hanya superadmin atau up2k_admin yang boleh melihat dan mengelola pengguna
    if (!user || (user.level !== "superadmin" && user.level !== "up2k_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pengguna = await prisma.pengguna.findMany({
      include: {
        kelompok: true, // Untuk mendapatkan detail nama kelompok
      },
      orderBy: {
        dibuatPada: 'desc'
      }
    });

    // Jangan kembalikan hash password ke frontend
    const safePengguna = pengguna.map((p: any) => {
      const { pasword, ...rest } = p;
      return rest;
    });

    return NextResponse.json(safePengguna);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user || (user.level !== "superadmin" && user.level !== "up2k_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { nama, no_tlp, username, pasword, level, kelompokId } = body;

    if (!nama || !username || !pasword || !level) {
      return NextResponse.json({ error: "Nama, username, password, dan level wajib diisi" }, { status: 400 });
    }

    // Cek apakah username sudah ada
    const existingUser = await prisma.pengguna.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Username sudah digunakan" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(pasword, 10);

    const newPengguna = await prisma.pengguna.create({
      data: {
        nama,
        no_tlp: no_tlp || "",
        username,
        pasword: hashedPassword,
        level,
        kelompokId: level === "up2k_kelompok" && kelompokId ? Number(kelompokId) : null,
      },
      include: {
        kelompok: true
      }
    });

    const { pasword: _, ...safeNewPengguna } = newPengguna;
    return NextResponse.json(safeNewPengguna, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
