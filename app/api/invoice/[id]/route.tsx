import { PaymentStatus } from "@/lib/generated/prisma";
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
            userProfile: true,
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

    interface InvoiceItem {
      description: string;
      qty: number;
      price: number;
    }

    interface InvoiceData {
      customer: string;
      number: string;
      email: string;
      date: Date; // bisa diganti Date kalau mau parsing
      dueDate: Date; // bisa diganti Date juga
      items: InvoiceItem[];
      status: PaymentStatus;
      imgLogo?: string; // optional, default bisa kosong
      paymentLink?: string; // optional, default bisa kosong
    }

    const webInfo = await prisma.websiteInfo.findFirst();
    const data: InvoiceData = {
      customer: paymentDetail.subscription?.userProfile.name || "",
      number: paymentDetail.number,
      date: paymentDetail.createdAt,
      dueDate: paymentDetail.expiredAt || new Date(),
      email: paymentDetail.subscription?.userProfile.phone + "@mail.id" || "",
      items: [
        {
          description: paymentDetail.subscription?.package.name || "",
          price: paymentDetail.amount,
          qty: 1,
        },
      ],
      status: paymentDetail.status,
      imgLogo: webInfo?.logoUrl || "",
      paymentLink: paymentDetail.paymentLink,
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
