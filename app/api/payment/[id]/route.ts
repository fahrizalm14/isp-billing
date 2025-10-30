import { billing } from "@/lib/payment";
import { calculatePaymentTotals } from "@/lib/paymentTotals";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await context.params).id;
    const paymentDetail = await prisma.payment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            profile: {
              select: {
                phone: true,
                address: {
                  select: {
                    city: true,
                    district: true,
                    province: true,
                    street: true,
                  },
                },
              },
            },
          },
        },
        subscription: {
          select: {
            package: {
              select: {
                id: true,
                name: true,
              },
            },
            number: true,
            userProfile: { select: { name: true } },
          },
        },
      },
    });

    if (!paymentDetail) {
      return NextResponse.json(
        { error: "Pembayaran tidak ditemukan." },
        { status: 404 }
      );
    }
    interface paymentDetail {
      amount: number;
      discount: number;
      netAmount: number;
      taxAmount: number;
      taxValue: number;
      status: string;
      transactionNumber: string;
      number: string;
      customer: string;
      id: string;
      packageName: string;
      createdAt: Date;
      dueDate?: Date | null;
      expiredAt?: Date | null;
      subscriptionId: string | null;
      subscriptionNumber: string;
    }

    const totals = calculatePaymentTotals({
      amount: paymentDetail.amount,
      discount: paymentDetail.discount ?? 0,
      taxPercent: paymentDetail.tax ?? 0,
    });

    const data: paymentDetail = {
      transactionNumber: paymentDetail.number,
      amount: totals.baseAmount,
      discount: totals.discount,
      netAmount: totals.total,
      taxAmount: totals.taxPercent,
      taxValue: totals.taxValue,
      createdAt: paymentDetail.createdAt,
      status: paymentDetail.status as string,
      packageName: paymentDetail.subscription?.package.name || "-",
      subscriptionNumber: paymentDetail.subscription?.number || "",
      customer: paymentDetail.subscription?.userProfile.name || "-",
      id: paymentDetail.id,
      number: paymentDetail.number,
      dueDate: paymentDetail.expiredAt,
      expiredAt: paymentDetail.expiredAt,
      subscriptionId: paymentDetail.subscriptionId,
    };

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Midtrans createPaymentLink error:", error);
    return NextResponse.json(
      { error: "Gagal membuat payment link" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await context.params).id;
    const body = await req.json();

    const { reference: transactionId } = body;

    // update payment
    const paymentDetail = await prisma.payment.findUnique({
      where: { id }, // pastikan unique
      include: {
        subscription: {
          include: {
            package: {
              include: {
                router: true,
              },
            },
          },
        },
      },
    });

    if (!paymentDetail)
      return NextResponse.json(
        { error: "Pembayaran tidak ditemukan!" },
        { status: 400 }
      );

    if (paymentDetail.status === "SUCCESS")
      return NextResponse.json(
        { error: "Pembayaran sudah lunas!" },
        { status: 400 }
      );

    // proses update
    await billing({
      id,
      status: "SUCCESS",
      subscriptionId: paymentDetail?.subscriptionId || "",
      transactionId,
    });

    return NextResponse.json({}, { status: 201 });
  } catch (error) {
    console.error("Midtrans createPaymentLink error:", error);
    return NextResponse.json(
      { error: "Gagal membuat payment link" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await context.params).id;

    const payment = await prisma.payment.delete({ where: { id } });

    if (!payment)
      return NextResponse.json(
        { message: "Pembayaran tidak ditemukan!" },
        { status: 400 }
      );

    return NextResponse.json(
      { message: "Berhasil hapus pembayaran!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Midtrans createPaymentLink error:", error);
    return NextResponse.json(
      { error: "Gagal membuat payment link" },
      { status: 500 }
    );
  }
}
