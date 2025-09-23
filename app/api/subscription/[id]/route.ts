import { decrypt } from "@/lib/crypto";
import { deleteUserPPPOE, movePPPOEToProfile } from "@/lib/mikrotik/pppoe";
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
    await deleteUserPPPOE(
      {
        host: subsToDelete.package.router.ipAddress,
        password: decrypt(subsToDelete.package.router.apiPassword),
        port: subsToDelete.package.router.port,
        username: subsToDelete.package.router.apiUsername,
      },
      subsToDelete.usersPPPOE.length ? subsToDelete.usersPPPOE[0].username : ""
    );

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
      odp: subscription.odp?.name || "",
      odpId: subscription.odp?.id || "",
      routerName: subscription.odp?.router?.name || "",
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
      payments: subscription.payments.map((p) => ({
        id: p.id,
        number: p.number,
        amount: p.amount,
        tax: p.tax,
        status: p.status,
        paymentMethod: p.paymentMethod,
        createdAt: p.createdAt,
      })),
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
    const { customerName, customerPhone, address, odpId, packageId } = body;

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
      },
      include: {
        package: { include: { router: true } }, // ambil router baru
        usersPPPOE: true,
      },
    });

    // ✅ move PPPoE user ke profile sesuai package baru
    if (
      updatedSubscription.usersPPPOE.length &&
      updatedSubscription.package?.router
    ) {
      const router = updatedSubscription.package.router;
      const userPPPOE = updatedSubscription.usersPPPOE[0];

      try {
        await movePPPOEToProfile(
          {
            host: router.ipAddress,
            username: router.apiUsername,
            password: decrypt(router.apiPassword),
            port: router.port,
          },
          {
            profile: updatedSubscription.package.name,
            name: userPPPOE.username,
          }
        );
      } catch (err) {
        console.error(`[PUT][SUBSCRIPTION][${id}] gagal move PPPoE`, err);
      }
    }

    return NextResponse.json({
      message: "Langganan berhasil diperbarui.",
      data: updatedSubscription,
    });
  } catch (error) {
    console.error("[PUT][SUBSCRIPTION]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui langganan." },
      { status: 500 }
    );
  }
}
