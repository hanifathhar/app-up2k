import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

// Helper function to recalculate all balances for a kelompok
async function recalculateSaldo(kelompokId: number) {
  const transactions = await prisma.bukuKasUmum.findMany({
    where: { kelompokId },
    orderBy: [{ tanggal: 'asc' }, { id: 'asc' }]
  });

  let currentSaldo = 0;
  for (const trx of transactions) {
    if (trx.jenis === "PENERIMAAN") {
      currentSaldo += Number(trx.jumlah);
    } else {
      currentSaldo -= Number(trx.jumlah);
    }
    await prisma.bukuKasUmum.update({
      where: { id: trx.id },
      data: { saldo: currentSaldo }
    });
  }
}

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
    const { tanggal, uraian, jenis, jumlah } = body;

    const existingBku = await prisma.bukuKasUmum.findUnique({ where: { id } });
    if (!existingBku) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    if (!isAdmin && existingBku.kelompokId !== user.kelompokId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.bukuKasUmum.update({
      where: { id },
      data: {
        tanggal: new Date(tanggal),
        uraian,
        jenis,
        jumlah: Number(jumlah)
      }
    });

    // Recalculate balances
    await recalculateSaldo(existingBku.kelompokId!);

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

    const existingBku = await prisma.bukuKasUmum.findUnique({ where: { id } });
    if (!existingBku) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    if (!isAdmin && existingBku.kelompokId !== user.kelompokId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.bukuKasUmum.delete({ where: { id } });

    // Recalculate balances
    await recalculateSaldo(existingBku.kelompokId!);

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

