import { decrypt } from "@/lib/crypto";
import { getPPPOEActiveStats } from "@/lib/mikrotik/pppoe";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await context.params).id;

    const subs = await prisma.subscription.findFirst({
      where: {
        number: id,
      },
      include: {
        usersPPPOE: true,
        package: {
          include: {
            router: true,
          },
        },
      },
    });

    if (!subs) {
      return NextResponse.json(
        { error: "No Pelanggan tidak ditemukan" },
        { status: 400 }
      );
    }

    if (!subs.usersPPPOE.length) {
      return NextResponse.json(
        { error: "User PPPoE tidak ditemukan" },
        { status: 400 }
      );
    }

    if (!subs.package.router) {
      return NextResponse.json(
        { error: "Router tidak ditemukan" },
        { status: 400 }
      );
    }

    const username = subs.usersPPPOE[0].username;

    const routerConfig = {
      host: subs.package.router.ipAddress,
      username: subs.package.router.apiUsername || "",
      password: decrypt(subs.package.router.apiPassword || ""),
      port: Number(subs.package.router.port) || 65534,
    };

    const stats = await getPPPOEActiveStats(routerConfig, username);

    if (!stats) {
      return NextResponse.json({
        data: {
          isOnline: false,
          bytesIn: 0,
          bytesOut: 0,
          totalBytes: 0,
        },
      });
    }

    return NextResponse.json({ data: stats }, { status: 200 });
  } catch (error) {
    console.error("Get bandwidth usage error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data bandwidth" },
      { status: 500 }
    );
  }
}
