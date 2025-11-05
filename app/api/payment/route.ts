import { createPayment } from "@/lib/payment";
import { calculatePaymentTotals } from "@/lib/paymentTotals";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: {
          OR: [
            { number: { contains: search } },
            {
              subscription: {
                OR: [
                  {
                    number: { contains: search },
                  },
                  {
                    userProfile: {
                      name: { contains: search },
                    },
                  },
                ],
              },
            },
          ],
        },
        skip,
        take: limit,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          number: true,
          amount: true,
          discount: true,
          additionalPrice: true,
          tax: true,
          status: true,
          createdAt: true,
          expiredAt: true,

          subscription: {
            select: {
              number: true,
              userProfile: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.payment.count({
        where: {
          OR: [
            { number: { contains: search } },
            { user: { name: { contains: search } } },
            {
              subscription: {
                number: { contains: search },
              },
            },
          ],
        },
      }),
    ]);

    // Mapping ke struktur untuk table UI
    const mapped = payments.map((p) => {
      const totals = calculatePaymentTotals({
        amount: p.amount,
        discount: p.discount ?? 0,
        additionalPrice: p.additionalPrice ?? 0,
        taxPercent: p.tax ?? 0,
      });

      return {
        id: p.id,
        number: p.number, // Nomor Tagihan
        customer: p.subscription?.userProfile.name || "-", // Customer
        subscriptionNumber: p.subscription?.number || "-", // Subscription
        subtotal: totals.baseAmount,
        discount: totals.discount,
        additionalPrice: totals.additionalPrice,
        tax: totals.taxPercent,
        taxValue: totals.taxValue,
        amount: totals.total, // Jumlah akhir (setelah diskon + pajak)
        status: p.status, // Status
        createdAt: p.createdAt.toISOString(), // Tgl Dibuat
        expiredAt: p.expiredAt ? p.expiredAt.toISOString() : "", // Jatuh Tempo
      };
    });

    return NextResponse.json({
      data: mapped,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[GET][PAYMENTS]", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

const PaymentSchema = z.object({
  amount: z.number().positive(),
  taxAmount: z.number().min(0),
  subscriptionId: z.string().min(1),
  // discount dan additionalPrice otomatis diambil dari subscription
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = PaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.message },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { id: parsed.data.subscriptionId },
      select: {
        discount: true,
        additionalPrice: true,
        package: {
          select: {
            name: true,
            id: true,
          },
        },
        userProfile: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!subscription)
      return NextResponse.json(
        { error: "Invalid payload", details: "Langganan tidak ditemukan!" },
        { status: 400 }
      );

    await createPayment({
      amount: parsed.data.amount,
      customerName: subscription.userProfile.name,
      subscriptionId: parsed.data.subscriptionId,
      email: "",
      packageId: subscription.package.id,
      packageName: subscription.package.name,
      taxAmount: parsed.data.taxAmount,
      discountAmount: subscription.discount || 0,
      additionalAmount: subscription.additionalPrice || 0,
      validPhoneNumber: subscription.userProfile.phone || "",
    });

    return NextResponse.json({ data: parsed.data });
  } catch (err) {
    console.error("[POST][PAYMENT]", err);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}
