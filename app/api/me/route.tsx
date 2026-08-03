import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "rahasia-super-aman";

export async function GET(req: Request) {
  try {
    // Ambil semua cookie
    const cookieHeader = req.headers.get("cookie") || "";
    console.log("📦 Header cookie:", cookieHeader);

    // Ambil cookie token secara akurat (bukan sekadar split 'token=')
    const tokenMatch = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("token="));

    const rawToken = tokenMatch ? tokenMatch.split("=")[1] : "";

    console.log("🧾 Token mentah:", rawToken);

    if (!rawToken) {
      return NextResponse.json({ error: "Token tidak ditemukan" }, { status: 401 });
    }

    // Bersihkan dan decode
    const cleanToken = decodeURIComponent(rawToken.replace(/^Bearer\s+/, "").trim());
    console.log("✅ Token bersih:", cleanToken);

    // Verifikasi token
    const decoded = jwt.verify(cleanToken, JWT_SECRET) as {
      id: number;
      username: string;
    };
    console.log("👤 Token decoded:", decoded);

    // Ambil user
    const user = await prisma.pengguna.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        nama: true,
        no_tlp: true,
        username: true,
        level: true,
        kelompok: {
          select: {
            id: true,
            nama_kelompok: true
          }
        }
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
