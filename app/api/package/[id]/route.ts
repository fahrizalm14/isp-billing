import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  req: NextRequest, // Use NextRequest instead of Request
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;
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

    const updated = await prisma.package.update({
      where: { id },
      data: {
        name,
        description,
        routerId,
        poolName,
        localAddress,
        rateLimit,
        price,
        active,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[PUT][PACKAGE]", error);
    return NextResponse.json(
      { error: "Gagal mengupdate paket." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const packageToDelete = await prisma.package.findUnique({
      where: { id: params.id },
      include: { router: true },
    });

    if (!packageToDelete) {
      return NextResponse.json(
        { error: "Paket tidak ditemukan." },
        { status: 404 }
      );
    }

    // const { deletePppoeProfile } = await import("@/lib/mikrotik/profile");
    // await deletePppoeProfile(
    //   {
    //     host: packageToDelete.router.ipAddress,
    //     username: packageToDelete.router.apiUsername,
    //     password: decrypt(packageToDelete.router.apiPassword),
    //     port: Number(packageToDelete.router.port) || 22,
    //   },
    //   toProfileKey(packageToDelete.name)
    // );

    await prisma.package.delete({
      where: { id: packageToDelete.id },
    });

    return NextResponse.json({ message: "Paket berhasil dihapus." });
  } catch (error) {
    console.error("[DELETE][PACKAGE]", error);
    return NextResponse.json(
      { error: "Gagal menghapus paket." },
      { status: 500 }
    );
  }
}
