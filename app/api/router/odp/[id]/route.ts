import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;
    const body = await req.json();
    const { name, location, longitude, latitude, region, capacity, routerId } =
      body;

    const updated = await prisma.odp.update({
      where: { id },
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

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[PUT][ODP]", error);
    return NextResponse.json(
      { error: "Gagal memperbarui ODP" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;

    await prisma.odp.delete({
      where: { id },
    });

    return NextResponse.json({ message: "ODP berhasil dihapus" });
  } catch (error) {
    console.error("[DELETE][ODP]", error);
    return NextResponse.json({ error: "Gagal menghapus ODP" }, { status: 500 });
  }
}
