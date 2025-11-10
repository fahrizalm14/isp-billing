import { decrypt } from "@/lib/crypto";
import { movePPPOEToProfile } from "@/lib/mikrotik/pppoe";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Daftar subscription tidak valid." },
        { status: 400 }
      );
    }

    // ambil semua subscription lengkap
    const subscriptions = await prisma.subscription.findMany({
      where: { id: { in: ids } },
      include: {
        package: { include: { router: true } },
        usersPPPOE: true,
      },
    });

    if (!subscriptions.length) {
      return NextResponse.json(
        { error: "Tidak ada subscription ditemukan." },
        { status: 404 }
      );
    }

    for (const subs of subscriptions) {
      // update status active
      await prisma.subscription.update({
        where: { id: subs.id },
        data: { active: true, updatedAt: new Date() },
      });

      // pastikan ada user PPPoE & router
      if (subs.usersPPPOE.length && subs.package?.router) {
        const router = subs.package.router;
        const userPPPOE = subs.usersPPPOE[0];

        try {
          await movePPPOEToProfile(
            {
              host: router.ipAddress,
              username: router.apiUsername,
              password: decrypt(router.apiPassword),
              port: router.port,
            },
            {
              profile: subs.package.name,
              name: userPPPOE.username,
            }
          );
        } catch (err) {
          console.error(`[BYPASS][${subs.id}] gagal move PPPoE`, err);
        }
      }
    }

    return NextResponse.json({
      message: "Bypass isolir berhasil.",
      ids,
    });
  } catch (error) {
    console.error("[POST][SUBSCRIPTION_BYPASS]", error);
    return NextResponse.json(
      { error: "Gagal melakukan bypass isolir." },
      { status: 500 }
    );
  }
}
