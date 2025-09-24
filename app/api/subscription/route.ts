// import {
//   generatePaymentNumber,
//   generateSubscriptionNumber,
// } from "@/lib/numbering";
import { formatPhoneNumberToIndonesia } from "@/lib/mikrotik/adapator";
import { generateSubscriptionNumber } from "@/lib/numbering";
import { createPayment } from "@/lib/payment";
import { prisma } from "@/lib/prisma";
import { runTriggers } from "@/lib/runTriggers";
import { NextRequest, NextResponse } from "next/server";

interface Address {
  city: string;
  district: string;
  province: string;
  subDistrict: string;
  postalCode: string;
  street: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      customerName: name,
      customerPhone: phone,
      address,
      odpId,
      packageId,
    } = body;
    const newAddress = address as Address;

    // todo validasi payload
    if (!name || !phone || !address || !odpId || !packageId) {
      return NextResponse.json(
        { error: "Semua field wajib diisi." },
        { status: 400 }
      );
    }

    if (
      !newAddress.city ||
      !newAddress.district ||
      !newAddress.postalCode ||
      !newAddress.street ||
      !newAddress.province ||
      !newAddress.subDistrict
    )
      return NextResponse.json(
        { error: "Alamat wajib diisi." },
        { status: 400 }
      );

    // todo simpan ke database subscription
    // ambil info harga paket
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!pkg)
      return NextResponse.json(
        { error: "Paket tidak ditemukan!" },
        { status: 400 }
      );

    const number = await generateSubscriptionNumber();
    const validPhoneNumber = formatPhoneNumberToIndonesia(phone);

    if (!validPhoneNumber)
      return NextResponse.json(
        { error: "Nomor whatsapp tidak valid!" },
        { status: 400 }
      );

    const profile = await prisma.userProfile.create({
      data: {
        address: {
          create: {
            ...newAddress,
          },
        },
        name,
        phone,
      },
    });

    if (!profile)
      return NextResponse.json(
        { error: "Gagal menyimpan langganan." },
        { status: 400 }
      );

    const subs = await prisma.subscription.create({
      data: {
        dueDate: "",
        number,
        packageId,
        odpId,
        userProfileId: profile.id,
      },
    });

    await runTriggers("REGISTER_SUCCESS", subs.id);
    await createPayment({
      amount: pkg.price,
      customerName: profile.name,
      email: `${subs.number}@mail.id`,
      packageId: pkg.id,
      packageName: pkg.name,
      taxAmount: 0,
      validPhoneNumber,
      subscriptionId: subs.id,
    });

    return NextResponse.json({ success: true, subscription: [] });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    // const where = ;

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where: {
          OR: [
            {
              userProfile: {
                name: {
                  contains: search,
                },
              },
            },
            { package: { name: { contains: search } } },
            {
              number: { contains: search },
            },
          ],
        },
        skip,
        take: limit,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          expiredAt: true,
          createdAt: true,
          userProfile: {
            select: {
              phone: true,
              name: true,
            },
          },
          number: true,
          active: true,
          dueDate: true,
          package: {
            select: {
              name: true,
              router: { select: { name: true } },
              price: true,
            },
          },
          payments: {
            select: {
              id: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
          odp: {
            select: { name: true, router: { select: { name: true } } },
          },
        },
      }),
      prisma.subscription.count({
        where: {
          OR: [
            {
              userProfile: {
                name: {
                  contains: search,
                },
              },
            },
            { package: { name: { contains: search } } },
            {
              number: { contains: search },
            },
          ],
        },
      }),
    ]);

    const today = new Date();
    const mapped = subscriptions.map((s) => {
      const expired = s.expiredAt ? new Date(s.expiredAt) : null;

      let remainingDays = 0;
      if (expired) {
        const diffTime = expired.getTime() - today.getTime();
        remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        id: s.id,
        name: s.userProfile?.name || "",
        number: s.number,
        phone: s.userProfile?.phone || "",
        odpName: s.odp?.name || "",
        routerName: s.package?.router?.name || "",
        packageName: s.package?.name || "",
        packagePrice: s.package?.price || 0,
        status: s.active,
        remainingDays,
        expiredAt: s.expiredAt?.toISOString() || "",
        paymentId: s.payments.length ? s.payments[0].id : "",
        createdAt: s.dueDate,
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
    console.error("[GET][SUBSCRIPTIONS]", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}
