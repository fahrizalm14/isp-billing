import { billing } from "@/lib/payment";
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
      status: string;
      transactionNumber: string;
      number: string;
      customer: string;
      id: string;
      packageName: string;
      createdAt: Date;
      dueDate?: Date | null;
    }

    const data: paymentDetail = {
      transactionNumber: paymentDetail.number,
      amount: paymentDetail.amount,
      createdAt: paymentDetail.createdAt,
      status: paymentDetail.status as string,
      packageName: paymentDetail.subscription?.package.name || "-",
      customer: paymentDetail.subscription?.userProfile.name || "-",
      id: paymentDetail.id,
      number: paymentDetail.number,
      dueDate: paymentDetail.expiredAt,
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
      // mikrotik: {
      //   host: paymentDetail?.subscription?.package.router.ipAddress || "",
      //   username: paymentDetail?.subscription?.package.router.apiUsername || "",
      //   password: decrypt(
      //     paymentDetail?.subscription?.package.router.apiPassword || ""
      //   ),
      //   port: Number(paymentDetail?.subscription?.package.router.port) || 22,
      // },
      status: "SUCCESS",
      // packageName: paymentDetail?.subscription?.package.name || "",
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
