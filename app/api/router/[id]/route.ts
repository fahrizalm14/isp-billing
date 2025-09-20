import { encrypt } from "@/lib/crypto";
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
    const {
      name,
      ipAddress,
      apiUsername,
      apiPassword, // Optional update
      description,
      port,
    } = body;

    // Bangun data yang akan di-update
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      name,
      ipAddress,
      apiUsername,
      description,
      port,
    };

    // Kalau ada apiPassword dan tidak kosong, update juga
    if (apiPassword?.trim()) {
      updateData.apiPassword = encrypt(apiPassword);
    }

    const updated = await prisma.router.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("[PUT][ROUTER]", error);
    return NextResponse.json(
      { error: "Failed to update router" },
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
    await prisma.router.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Router deleted successfully" });
  } catch (error) {
    console.error("[DELETE][ROUTER]", error);
    return NextResponse.json(
      { error: "Failed to delete router" },
      { status: 500 }
    );
  }
}
