import { decrypt } from "@/lib/crypto";
import { getGatewayFromPool } from "@/lib/mikrotik/adapator";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const [packages, total] = await Promise.all([
      prisma.package.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          active: true,
          poolName: true,
          localAddress: true,
          rateLimit: true,
          routerId: true,
          updatedAt: true,
          router: {
            select: {
              id: true,
              name: true,
              ipAddress: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      }),
      prisma.package.count({
        where: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        },
      }),
    ]);

    return NextResponse.json({
      data: packages,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[GET][PACKAGE]", error);
    return NextResponse.json(
      { error: "Failed to fetch packages" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      name,
      description,
      routerId,
      poolName,
      localAddress,
      rateLimit,
      price,
      active = true,
    } = body;

    const router = await prisma.router.findUnique({
      where: { id: routerId },
    });
    if (!router) {
      return NextResponse.json(
        { error: "Router tidak ditemukan." },
        { status: 404 }
      );
    }

    const { createProfilePPPOE } = await import("@/lib/mikrotik/profile");

    const convertLocalAddress = getGatewayFromPool(localAddress);
    await createProfilePPPOE(
      {
        host: router.ipAddress,
        username: router.apiUsername,
        password: decrypt(router.apiPassword),
        port: Number(router.port) || 22,
      },
      {
        name,
        localAddress: convertLocalAddress,
        remoteAddress: poolName,
        rateLimit: rateLimit || "0",
      }
    );

    const newPackage = await prisma.package.create({
      data: {
        name,
        description,
        routerId,
        poolName,
        localAddress: convertLocalAddress,
        rateLimit,
        price,
        active,
      },
    });
    if (!newPackage) {
      return NextResponse.json(
        { error: "Gagal menambahkan paket." },
        { status: 400 }
      );
    }
    return NextResponse.json({ data: newPackage }, { status: 201 });
  } catch (error) {
    console.error("[POST][PACKAGE]", error);
    return NextResponse.json(
      { error: "Gagal menambahkan paket." },
      { status: 500 }
    );
  }
}
