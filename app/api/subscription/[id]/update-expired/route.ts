import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await req.json();

    const { expiredAt } = body;

    if (!expiredAt) {
      return NextResponse.json(
        { error: "Tanggal expired wajib diisi" },
        { status: 400 }
      );
    }

    // Validasi format tanggal
    const date = new Date(expiredAt);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "Format tanggal tidak valid" },
        { status: 400 }
      );
    }

    // Cek apakah subscription ada
    const subscription = await prisma.subscription.findUnique({
      where: { id: params.id },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription tidak ditemukan" },
        { status: 404 }
      );
    }

    // Update expired date
    await prisma.subscription.update({
      where: { id: params.id },
      data: { expiredAt: new Date(expiredAt) },
    });

    return NextResponse.json({
      message: "Tanggal expired berhasil diupdate",
      data: { expiredAt },
    });
  } catch (error) {
    console.error("[PATCH][UPDATE_EXPIRED]", error);
    return NextResponse.json(
      { error: "Gagal mengupdate tanggal expired" },
      { status: 500 }
    );
  }
}
