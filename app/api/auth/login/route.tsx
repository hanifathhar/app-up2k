export const runtime = "nodejs"; // ⬅️ pastikan baris ini paling atas!

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

export async function POST(req: Request) {
  
  const unauthorized = validateApiKey(req);
  if (unauthorized) return unauthorized;

  try {
    const { username, pasword } = await req.json();

    if (!username || !pasword) {
      return NextResponse.json({ error: "Username dan password wajib diisi" }, { status: 400 });
    }

    const pengguna = await prisma.pengguna.findFirst({ where: { username } });
    if (!pengguna) {
      return NextResponse.json({ error: "Username tidak ditemukan" }, { status: 404 });
    }

    const validPasword = await bcrypt.compare(pasword, pengguna.pasword);
    if (!validPasword) {
      return NextResponse.json({ error: "Password salah" }, { status: 401 });
    }

    // ✅ Generate JWT token
    const token = jwt.sign(
      { id: pengguna.id, nama: pengguna.nama, no_tlp: pengguna.no_tlp, username: pengguna.username, level: pengguna.level, kelompokId: pengguna.kelompokId },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    const response = NextResponse.json({
      message: "Login berhasil",
      user: { id: pengguna.id, nama: pengguna.nama, no_tlp: pengguna.no_tlp, username: pengguna.username, level: pengguna.level, kelompokId: pengguna.kelompokId },
      token, // Kirim token juga ke frontend sebagai backup
    });

    // ✅ Simpan token di cookie
    //response.cookies.set({
    //  name: "token",
   //   value: token,
    //  httpOnly: true,
   //   secure: false, // Set false untuk development
   //   sameSite: "lax",
   //   path: "/",
   //   maxAge: 60 * 60 * 24,
   // });

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
