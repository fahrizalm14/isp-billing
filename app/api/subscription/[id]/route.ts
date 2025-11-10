import { decrypt } from "@/lib/crypto";
import {
  createUserPPPOE,
  getPPPOESecret,
  movePPPOEToProfile,
} from "@/lib/mikrotik/pppoe";
import { calculatePaymentTotals } from "@/lib/paymentTotals";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const subsToDelete = await prisma.subscription.findUnique({
      where: { id: params.id },
      select: {
        usersPPPOE: {
          select: {
            username: true,
          },
        },
        package: {
          select: {
            router: true,
          },
        },
      },
    });

    if (!subsToDelete) {
      return NextResponse.json(
        { error: "Labngganan tidak ditemukan." },
        { status: 404 }
      );
    }

    // hapus user ppoe
    // await deleteUserPPPOE(
    //   {
    //     host: subsToDelete.package.router.ipAddress,
    //     password: decrypt(subsToDelete.package.router.apiPassword),
    //     port: subsToDelete.package.router.port,
    //     username: subsToDelete.package.router.apiUsername,
    //   },
    //   subsToDelete.usersPPPOE.length ? subsToDelete.usersPPPOE[0].username : ""
    // );

    await prisma.userPPPOE.deleteMany({ where: { subscriptionId: params.id } });
    await prisma.subscription.delete({ where: { id: params.id } });
    return NextResponse.json({ message: "Langganan berhasil dihapus." });
  } catch (error) {
    console.error("[DELETE][PACKAGE]", error);
    return NextResponse.json(
      { error: "Gagal menghapus langganan." },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await context.params).id;
    if (!id)
      return NextResponse.json({ error: "Id langganan tidak diketahui." });

    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        userProfile: {
          include: {
            address: true,
          },
        },
        usersPPPOE: {
          select: {
            password: true,
            username: true,
          },
        },
        odp: {
          select: { name: true, id: true, router: { select: { name: true } } },
        },
        package: true,
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    const data = {
      id: subscription.id,
      number: subscription.number,
      active: subscription.active,
      dueDate: subscription.dueDate,
      expiredAt: subscription.expiredAt || new Date(),
      discount: subscription.discount || 0,
      additionalPrice: subscription.additionalPrice || 0,
      odp: subscription.odp?.name || "",
      odpId: subscription.odp?.id || "",
      routerName: subscription.odp?.router?.name || "",
      routerId: subscription.package?.routerId || "",
      customerName: subscription.userProfile?.name || "",
      customerPhone: subscription.userProfile?.phone || "",
      customerAddress: subscription.userProfile?.address
        ? `${subscription.userProfile.address.street ?? ""}, ${
            subscription.userProfile.address.subDistrict
          }, ${subscription.userProfile.address.district}, ${
            subscription.userProfile.address.city
          }, ${subscription.userProfile.address.province} ${
            subscription.userProfile.address.postalCode ?? ""
          }`.trim()
        : "",
      packageName: subscription.package?.name || "",
      packageId: subscription.package?.id || "",
      packageSpeed: subscription.package?.rateLimit || "",
      payments: subscription.payments.map((p) => {
        const totals = calculatePaymentTotals({
          amount: p.amount,
          discount: p.discount ?? 0,
          additionalPrice: p.additionalPrice ?? 0,
          taxPercent: p.tax ?? 0,
        });

        return {
          id: p.id,
          number: p.number,
          amount: totals.baseAmount,
          tax: totals.taxPercent,
          taxValue: totals.taxValue,
          discount: totals.discount,
          additionalPrice: totals.additionalPrice,
          netAmount: totals.total,
          status: p.status,
          paymentMethod: p.paymentMethod,
          createdAt: p.createdAt,
        };
      }),
      username: subscription.usersPPPOE.length
        ? subscription.usersPPPOE[0].username
        : undefined,
      password: subscription.usersPPPOE.length
        ? subscription.usersPPPOE[0].password
        : undefined,
      address: subscription.userProfile.address,
    };

    return NextResponse.json({ message: "Get info langganan berhasil.", data });
  } catch (error) {
    console.error("[GET][PACKAGE]", error);
    return NextResponse.json(
      { error: "Gagal get info langganan." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { error: "Id tidak ditemukan." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      customerName,
      customerPhone,
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
    const secretPayload = (pppoeSecret || null) as {
      username?: string;
      password?: string;
      fromRouter?: boolean;
    } | null;

    const subs = await prisma.subscription.findUnique({
      where: { id },
      include: {
        userProfile: { include: { address: true } },
        usersPPPOE: true,
        package: { include: { router: true } }, // ambil router lama
      },
    });

    if (!subs) {
      return NextResponse.json(
        { error: "Langganan tidak ditemukan." },
        { status: 404 }
      );
    }

    // ✅ update userProfile & address
    await prisma.userProfile.update({
      where: { id: subs.userProfileId },
      data: {
        name: customerName,
        phone: customerPhone,
        address: subs.userProfile.address
          ? {
              update: {
                street: address.street,
                subDistrict: address.subDistrict,
                district: address.district,
                city: address.city,
                province: address.province,
                postalCode: address.postalCode,
              },
            }
          : {
              create: {
                street: address.street,
                subDistrict: address.subDistrict,
                district: address.district,
                city: address.city,
                province: address.province,
                postalCode: address.postalCode,
              },
            },
      },
    });

    // ✅ update subscription relasi ODP & Package pakai ID
    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        odp: { connect: { id: odpId } },
        package: { connect: { id: packageId } },
        updatedAt: new Date(),
        dueDate,
        discount: sanitizedDiscount,
        additionalPrice: sanitizedAdditionalPrice,
      },
      include: {
        package: { include: { router: true } }, // ambil router baru
        usersPPPOE: true,
      },
    });

    let finalSubscription = updatedSubscription;
    const router = updatedSubscription.package?.router || null;
    const currentPPPOE =
      updatedSubscription.usersPPPOE.length > 0
        ? updatedSubscription.usersPPPOE[0]
        : null;

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
        try {
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

          if (currentPPPOE) {
            await prisma.userPPPOE.update({
              where: { id: currentPPPOE.id },
              data: {
                username: secretDetail.username,
                password: resolvedPassword,
                localAddress: secretDetail.localAddress || "",
              },
            });
          } else {
            await prisma.userPPPOE.create({
              data: {
                subscriptionId: id,
                username: secretDetail.username,
                password: resolvedPassword,
                localAddress: secretDetail.localAddress || "",
              },
            });
          }

          if (updatedSubscription.package?.name) {
            await movePPPOEToProfile(routerConfig, {
              profile: updatedSubscription.package.name,
              name: secretDetail.username,
            });
          }
        } catch (error) {
          console.error(
            `[PUT][SUBSCRIPTION][${id}] gagal assign secret router`,
            error
          );
          return NextResponse.json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Gagal memperbarui PPPoE dari router.",
            },
            { status: 400 }
          );
        }
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

          // if (currentPPPOE) {
          //   try {
          //     await deleteUserPPPOE(routerConfig, currentPPPOE.username);
          //   } catch (err) {
          //     console.warn(
          //       `[PUT][SUBSCRIPTION][${id}] tidak dapat menghapus PPPoE lama`,
          //       err
          //     );
          //   }
          // }

          // ✅ Validasi local address - hanya kirim jika format IP valid
          const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
          const localAddr = updatedSubscription.package?.localAddress?.trim();
          const validLocalAddress =
            localAddr && ipRegex.test(localAddr) ? localAddr : undefined;

          await createUserPPPOE(routerConfig, {
            name: normalizedUsername,
            password: normalizedPassword,
            profile: updatedSubscription.package?.profileName || "",
            localAddress: validLocalAddress,
          });

          if (currentPPPOE) {
            await prisma.userPPPOE.update({
              where: { id: currentPPPOE.id },
              data: {
                username: normalizedUsername,
                password: normalizedPassword,
                localAddress: validLocalAddress || "",
              },
            });
          } else {
            await prisma.userPPPOE.create({
              data: {
                subscriptionId: id,
                username: normalizedUsername,
                password: normalizedPassword,
                localAddress: validLocalAddress || "",
              },
            });
          }
        } catch (error) {
          console.error(
            `[PUT][SUBSCRIPTION][${id}] gagal create PPPoE manual`,
            error
          );
          return NextResponse.json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Gagal memperbarui PPPoE manual.",
            },
            { status: 400 }
          );
        }
      }

      finalSubscription =
        (await prisma.subscription.findUnique({
          where: { id },
          include: {
            package: { include: { router: true } },
            usersPPPOE: true,
          },
        })) ?? updatedSubscription;
    }

    // ✅ move PPPoE user ke profile sesuai package baru
    if (
      finalSubscription.usersPPPOE.length &&
      finalSubscription.package?.router
    ) {
      const newRouter = finalSubscription.package.router;
      const userPPPOE = finalSubscription.usersPPPOE[0];

      try {
        await movePPPOEToProfile(
          {
            host: newRouter.ipAddress,
            username: newRouter.apiUsername,
            password: decrypt(newRouter.apiPassword),
            port: newRouter.port,
          },
          {
            profile: finalSubscription.package.name,
            name: userPPPOE.username,
          }
        );
      } catch (err) {
        console.error(`[PUT][SUBSCRIPTION][${id}] gagal move PPPoE`, err);
      }
    }

    return NextResponse.json({
      message: "Langganan berhasil diperbarui.",
      data: finalSubscription,
    });
  } catch (error) {
    console.error("[PUT][SUBSCRIPTION]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui langganan." },
      { status: 500 }
    );
  }
}
