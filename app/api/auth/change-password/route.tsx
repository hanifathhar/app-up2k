import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET!;
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

export async function POST(req: NextRequest) {
  try {

    const unauthorized = validateApiKey(req);
    if (unauthorized) return unauthorized;
    
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        {
          message: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    const payload = jwt.verify(token, JWT_SECRET) as {
      id: number;
    };

    const { oldPassword, newPassword } = await req.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        {
          message: "Semua field wajib diisi",
        },
        {
          status: 400,
        }
      );
    }

    const user = await prisma.pengguna.findUnique({
      where: {
        id: payload.id,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          message: "User tidak ditemukan",
        },
        {
          status: 404,
        }
      );
    }

    const cocok = await bcrypt.compare(
      oldPassword,
      user.pasword
    );

    if (!cocok) {
      return NextResponse.json(
        {
          message: "Password lama salah",
        },
        {
          status: 400,
        }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.pengguna.update({
      where: {
        id: user.id,
      },
      data: {
        pasword: hashed,
      },
    });

    return NextResponse.json({
      message: "Password berhasil diubah",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Terjadi kesalahan server",
      },
      {
        status: 500,
      }
    );
  }
}