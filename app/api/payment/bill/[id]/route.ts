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
        userProfile: {
          select: {
            name: true,
          },
        },
        id: true,
        package: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!subs)
      return NextResponse.json(
        { error: "No Pelanggan tidak ditemukan" },
        { status: 400 }
      );

    const payment = await prisma.payment.findFirst({
      where: {
        subscriptionId: subs.id,
        status: {
          not: "SUCCESS",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        amount: true,
        paymentLink: true,
      },
    });

    if (!payment)
      return NextResponse.json(
        { error: "Tagihan bulan ini tidak ditemukan" },
        { status: 400 }
      );

    const data: {
      customer: string;
      subsId: string;
      amount: number;
      month: string;
      paymentLink?: string;
    } = {
      // amount:subs.
      customer: subs.userProfile.name,
      month: "",
      subsId: id,
      amount: payment.amount,
      paymentLink: payment.paymentLink,
    };

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Midtrans createPaymentLink error:", error);
    return NextResponse.json({ error: "Gagal cek tagihan" }, { status: 500 });
  }
}
