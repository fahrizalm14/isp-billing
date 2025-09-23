import { generatePaymentNumber } from "@/lib/numbering";
import { prisma } from "@/lib/prisma";
import midtransClient from "midtrans-client";
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
        subscription: {
          select: {
            userProfile: {
              select: {
                phone: true,
                name: true,
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
            package: {
              select: {
                id: true,
                name: true,
                router: {
                  select: {
                    apiPassword: true,
                    apiUsername: true,
                    ipAddress: true,
                    port: true,
                  },
                },
              },
            },
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

    if (paymentDetail.paymentLink && paymentDetail.status === "PENDING")
      return NextResponse.json(paymentDetail.paymentLink);

    let paymentId = paymentDetail.id;

    if (paymentDetail.paymentLink && paymentDetail.status !== "PENDING") {
      const number = await generatePaymentNumber();
      const { amount, subscriptionId, userId } = paymentDetail;
      const newPayment = await prisma.payment.create({
        data: { amount, subscriptionId, userId, number, tax: 0 },
      });

      paymentId = newPayment.id;
    }

    const info = await prisma.websiteInfo.findFirst();

    const snap = new midtransClient.Snap({
      isProduction: process.env.NODE_ENV === "production",
      serverKey: info?.midtransServerKey,
      clientKey: info?.midtransSecretKey,
    });

    const paymentLinkParams = {
      transaction_details: {
        order_id: paymentId,
        gross_amount: paymentDetail.amount,
      },
      item_details: [
        {
          id: paymentDetail.subscription?.package.id || "",
          price: paymentDetail.amount,
          quantity: 1,
          name: paymentDetail.subscription?.package.name || "",
        },
      ],
      customer_details: {
        first_name: paymentDetail.subscription?.userProfile.name || "",
        email: paymentDetail.subscription?.userProfile.phone || "",
        phone: paymentDetail.subscription?.userProfile.phone || "",
      },
      usage_limit: 1,
      expiry: {
        unit: "days",
        duration: 1,
      },
    };
    const response = await snap.createTransactionRedirectUrl(paymentLinkParams);
    // simpan payment link
    await prisma.payment.update({
      data: { paymentLink: response },
      where: { id: paymentId },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Midtrans createPaymentLink error:", error);
    return NextResponse.json(
      { error: "Gagal membuat payment link" },
      { status: 500 }
    );
  }
}
