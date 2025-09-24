import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    const [odps, total] = await Promise.all([
      prisma.odp.findMany({
        where: {
          OR: [
            { name: { contains: search } },
            { location: { contains: search } },
            { region: { contains: search } },
          ],
        },
        select: {
          id: true,
          name: true,
          location: true,
          longitude: true,
          latitude: true,
          region: true,
          capacity: true,
          routerId: true,
          router: {
            select: { id: true, name: true },
          },
          _count: {
            select: { subscriptions: true }, // <= hitung subscription ODP
          },
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      }),
      prisma.odp.count({
        where: {
          OR: [
            { name: { contains: search } },
            { location: { contains: search } },
            { region: { contains: search } },
          ],
        },
      }),
    ]);

    return NextResponse.json({
      data: odps.map((odp) => ({
        ...odp,
        usedPort: odp._count.subscriptions, // rename jadi usedPort
      })),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[GET][ODP]", error);
    return NextResponse.json(
      { error: "Gagal mengambil data ODP" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, location, longitude, latitude, region, capacity, routerId } =
      body;

    const odp = await prisma.odp.create({
      data: {
        name,
        location,
        longitude: longitude || "",
        latitude: latitude || "",
        region,
        capacity,
        routerId,
      },
    });

    return NextResponse.json({ data: odp }, { status: 201 });
  } catch (error) {
    console.error("[POST][ODP]", error);
    return NextResponse.json(
      { error: "Gagal menambahkan ODP" },
      { status: 500 }
    );
  }
}
