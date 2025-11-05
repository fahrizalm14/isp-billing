// import {
//   generatePaymentNumber,
//   generateSubscriptionNumber,
// } from "@/lib/numbering";
import { decrypt } from "@/lib/crypto";
import { formatPhoneNumberToIndonesia } from "@/lib/mikrotik/adapator";
import { createUserPPPOE, getPPPOESecret } from "@/lib/mikrotik/pppoe";
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

interface PPPoESecretPayload {
  id?: string;
  username?: string;
  password?: string;
  fromRouter?: boolean;
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
      dueDate,
      discount = 0,
      additionalPrice = 0,
      pppoeSecret,
    } = body;
    const sanitizedDiscount =
      typeof discount === "number" && Number.isFinite(discount)
        ? Math.max(Math.floor(discount), 0)
        : 0;
    const sanitizedAdditionalPrice =
      typeof additionalPrice === "number" && Number.isFinite(additionalPrice)
        ? Math.max(Math.floor(additionalPrice), 0)
        : 0;
    const newAddress = address as Address;

    // todo validasi payload
    if (!name || !phone || !address || !odpId || !packageId) {
      return NextResponse.json(
        { error: "Semua field wajib diisi." },
        { status: 400 }
      );
    }

    if (!newAddress.street)
      return NextResponse.json(
        { error: "Alamat wajib diisi." },
        { status: 400 }
      );

    // todo simpan ke database subscription
    // ambil info harga paket
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
      include: {
        router: true,
      },
    });

    if (!pkg)
      return NextResponse.json(
        { error: "Paket tidak ditemukan!" },
        { status: 400 }
      );

    const router = pkg.router;
    const secretPayload = (pppoeSecret || null) as PPPoESecretPayload | null;
    let assignedSecret: {
      username: string;
      password: string;
      localAddress?: string;
    } | null = null;

    if (secretPayload?.username) {
      const normalizedUsername = String(secretPayload.username).trim();
      const normalizedPassword = String(secretPayload.password ?? "").trim();

      if (!normalizedUsername) {
        return NextResponse.json(
          { error: "Username PPPoE wajib diisi." },
          { status: 400 }
        );
      }

      const ensureRouter = () => {
        if (!router) {
          throw new Error("Router untuk paket tidak ditemukan!");
        }
        return {
          host: router.ipAddress,
          username: router.apiUsername,
          password: decrypt(router.apiPassword),
          port: Number(router.port) || 22,
        };
      };

      if (secretPayload.fromRouter) {
        if (!router) {
          return NextResponse.json(
            { error: "Router untuk paket tidak ditemukan!" },
            { status: 400 }
          );
        }

        const routerConfig = ensureRouter();

        const secretDetail = await getPPPOESecret(
          routerConfig,
          normalizedUsername
        );

        if (!secretDetail) {
          return NextResponse.json(
            { error: "Secret PPPoE tidak ditemukan di router." },
            { status: 400 }
          );
        }

        const resolvedPassword =
          secretDetail.password && secretDetail.password !== "***"
            ? secretDetail.password
            : normalizedPassword;

        if (!resolvedPassword) {
          return NextResponse.json(
            {
              error: "Password PPPoE tidak tersedia.",
            },
            { status: 400 }
          );
        }

        assignedSecret = {
          username: secretDetail.username,
          password: resolvedPassword,
          localAddress: secretDetail.localAddress || "",
        };
      } else {
        if (!normalizedPassword) {
          return NextResponse.json(
            {
              error: "Password PPPoE wajib diisi untuk input manual.",
            },
            { status: 400 }
          );
        }

        try {
          const routerConfig = ensureRouter();

          // ✅ Validasi local address - hanya kirim jika format IP valid
          const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
          const localAddr = pkg.localAddress?.trim();
          const validLocalAddress =
            localAddr && ipRegex.test(localAddr) ? localAddr : undefined;

          console.log({
            name: normalizedUsername,
            password: normalizedPassword,
            profile: pkg.profileName || "",
            localAddress: validLocalAddress,
            originalLocalAddress: pkg.localAddress,
          });

          await createUserPPPOE(routerConfig, {
            name: normalizedUsername,
            password: normalizedPassword,
            profile: pkg.profileName || "",
            localAddress: validLocalAddress,
          });
        } catch (error) {
          console.error(
            "[POST][SUBSCRIPTION] gagal create PPPoE manual",
            error
          );
          return NextResponse.json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Gagal membuat user PPPoE manual.",
            },
            { status: 400 }
          );
        }

        assignedSecret = {
          username: normalizedUsername,
          password: normalizedPassword,
        };
      }
    }

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
        dueDate,
        number,
        packageId,
        odpId,
        discount: sanitizedDiscount,
        additionalPrice: sanitizedAdditionalPrice,
        userProfileId: profile.id,
      },
    });

    if (assignedSecret) {
      await prisma.userPPPOE.create({
        data: {
          subscriptionId: subs.id,
          username: assignedSecret.username,
          password: assignedSecret.password,
          localAddress: assignedSecret.localAddress || "",
        },
      });
    }

    await runTriggers("REGISTER_SUCCESS", subs.id);
    await createPayment({
      amount: pkg.price,
      customerName: profile.name,
      email: `${subs.number}@mail.id`,
      packageId: pkg.id,
      packageName: pkg.name,
      taxAmount: 0,
      discountAmount: sanitizedDiscount,
      additionalAmount: sanitizedAdditionalPrice,
      validPhoneNumber,
      subscriptionId: subs.id,
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: subs.id,
        number: subs.number,
        pppoe: assignedSecret
          ? {
              username: assignedSecret.username,
              password: assignedSecret.password,
            }
          : null,
      },
    });
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
          discount: true,
          additionalPrice: true,
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
        discount: s.discount || 0,
        additionalPrice: s.additionalPrice || 0,
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
