import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await context.params).id;

    const subs = await prisma.subscription.findFirst({
      where: {
        number: id,
      },
      select: {
        id: true,
      },
    });

    if (!subs)
      return NextResponse.json(
        { error: "No Pelanggan tidak ditemukan" },
        { status: 400 }
      );

    const payments = await prisma.payment.findMany({
      where: {
        subscriptionId: subs.id,
        status: "SUCCESS",
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        amount: true,
        updatedAt: true,
        paymentMethod: true,
        number: true,
      },
    });

    return NextResponse.json({ data: payments }, { status: 200 });
  } catch (error) {
    console.error("Get payment history error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil riwayat pembayaran" },
      { status: 500 }
    );
  }
}
