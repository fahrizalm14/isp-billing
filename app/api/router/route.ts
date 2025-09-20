import { encrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const [routers, total] = await Promise.all([
      prisma.router.findMany({
        where: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { ipAddress: { contains: search, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          ipAddress: true,
          apiUsername: true,
          description: true,
          port: true,
          status: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: [
          { updatedAt: "desc" },
          { id: "desc" }, // penambahan ini penting
        ],
      }),
      prisma.router.count({
        where: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { ipAddress: { contains: search, mode: "insensitive" } },
          ],
        },
      }),
    ]);

    return NextResponse.json({
      data: routers,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[GET][ROUTER]", error);
    return NextResponse.json(
      { error: "Failed to fetch routers" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, ipAddress, apiUsername, apiPassword, description, port } =
      body;

    const router = await prisma.router.create({
      data: {
        name,
        ipAddress,
        apiUsername,
        apiPassword: encrypt(apiPassword),
        description,
        port,
      },
    });

    return NextResponse.json({ data: router }, { status: 201 });
  } catch (error) {
    console.error("[POST][ROUTER]", error);
    return NextResponse.json(
      { error: "Gagal menambahkan router" },
      { status: 500 }
    );
  }
}
