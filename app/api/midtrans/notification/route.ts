import { PaymentStatus } from "@/lib/generated/prisma";
import { billing } from "@/lib/payment";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

function mapMidtransStatus(
  midtransStatus: string,
  fraudStatus?: string
): PaymentStatus {
  switch (midtransStatus) {
    case "settlement":
      return PaymentStatus.SUCCESS;

    case "capture":
      return fraudStatus === "accept"
        ? PaymentStatus.SUCCESS
        : PaymentStatus.FAILED;

    case "pending":
      return PaymentStatus.PENDING;

    case "deny":
    case "expire":
    case "failure":
      return PaymentStatus.FAILED;

    case "cancel":
      return PaymentStatus.CANCELED;

    default:
      return PaymentStatus.FAILED;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body;

    const info = await prisma.websiteInfo.findFirst();

    const serverKey = info?.midtransServerKey || "";

    // hash signature
    const hash = crypto
      .createHash("sha512")
      .update(order_id + status_code + gross_amount + serverKey)
      .digest("hex");

    if (hash !== signature_key) {
      return NextResponse.json(
        { message: "Invalid signature" },
        { status: 403 }
      );
    }

    const paymentStatus = mapMidtransStatus(
      transaction_status ?? "",
      fraud_status
    );
    const paymentDetail = await prisma.payment.findUnique({
      where: { id: order_id },
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

    // proses update jika statusnya adalah sukses
    if (paymentStatus === "SUCCESS")
      await billing({
        id: order_id,
        // mikrotik: {
        //   host: paymentDetail.subscription?.package.router.ipAddress || "",
        //   username: paymentDetail.subscription?.package.router.apiUsername || "",
        //   password: decrypt(
        //     paymentDetail.subscription?.package.router.apiPassword || ""
        //   ),
        //   port: Number(paymentDetail.subscription?.package.router.port) || 22,
        // },
        status: paymentStatus,
        // packageName: paymentDetail.subscription?.package.name || "",
        subscriptionId: paymentDetail.subscriptionId || "",
        transactionId: "MIDTRANS_" + order_id,
      });

    return NextResponse.json({ message: "OK" });
  } catch (error) {
    console.error("Payment update failed:", error);
    return NextResponse.json({ message: "Order not found" }, { status: 404 });
  }
}
