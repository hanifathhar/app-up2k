export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "rahasia-super-aman";
const API_KEY = process.env.API_KEY || "";


function validateApiKey(req: Request) {
  const apiKey = req.headers.get("x-api-key");

  if (!apiKey || apiKey !== API_KEY) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized - Invalid API Key",
      },
      {
        status: 401,
      }
    );
  }

  return null;
}


export async function GET(req: Request) {

  const unauthorized = validateApiKey(req);
  if (unauthorized) return unauthorized;


  const data = await prisma.pengguna.findMany();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {

    const unauthorized = validateApiKey(req);
    if (unauthorized) return unauthorized;
    
    const { id, nama, no_tlp, username, pasword, level } = await req.json();

    // 🧩 Validasi input
    if (!nama || !no_tlp || !username || !pasword || !level) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    // 🧩 Cek apakah user sudah ada (by username atau no_tlp)
    const existingUser = await prisma.pengguna.findFirst({
      where: { OR: [{ username }, { no_tlp }] },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Username atau No. Telepon sudah terdaftar" },
        { status: 400 }
      );
    }

    // 🔒 Hash password
    const hashedPassword = await bcrypt.hash(pasword, 10);

    // 💾 Simpan ke database
    const newUser = await prisma.pengguna.create({
      data: {
        nama,
        no_tlp,
        username,
        pasword: hashedPassword,
        level: level,
      },
    });

    // 🎟️ Generate JWT
    const token = jwt.sign(
      {
        id: newUser.id,
        nama: newUser.nama,
        no_tlp: newUser.no_tlp,
        username: newUser.username,
        level: newUser.level,
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    // 🍪 Simpan token di cookie
    const response = NextResponse.json({
      message: "Registrasi berhasil",
      user: {
        id: newUser.id,
        nama: newUser.nama,
        no_tlp: newUser.no_tlp,
        username: newUser.username,
        level: newUser.level,
      },
    });

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 hari
    });

    return response;
  } catch (error) {
    console.error("❌ Error saat register:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
