export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { PrismaClient, Prisma  } from "@prisma/client";

const prisma = new PrismaClient();
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

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {

    const unauthorized = validateApiKey(req);
    if (unauthorized) return unauthorized;

    const { id } = await context.params;

    console.log("🟢 PARAMS:", id);

    if (!id || isNaN(Number(id))) {
      return NextResponse.json(
        { error: "ID user tidak valid" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { nama, no_tlp, username, pasword, level } = body;

    if (!nama || !no_tlp || !username || !level) {
      return NextResponse.json(
        { error: "Semua field wajib diisi" },
        { status: 400 }
      );
    }

    const dataToUpdate: Prisma.PenggunaUpdateInput = {
      nama,
      no_tlp,
      username,
      level: level,
    };

    if (pasword && pasword.trim() !== "") {
      const hashedPasword = await bcrypt.hash(pasword, 10);
      dataToUpdate.pasword = hashedPasword;
    }

    const updatedUser = await prisma.pengguna.update({
      where: { id: Number(id) },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedUser);
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

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {

    const unauthorized = validateApiKey(req);
    if (unauthorized) return unauthorized;
    
    const { id } = await context.params;
    const Id = Number(id);

    if (isNaN(Id)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    await prisma.pengguna.delete({ where: { id: Id } });
    return NextResponse.json({ message: "Berhasil dihapus" });
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
