import { prisma } from "@/lib/prisma";
import { deactivateSubscription } from "@/lib/subscription";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const subsToDeactivate = await prisma.subscription.findUnique({
      where: { id: params.id },
    });

    if (!subsToDeactivate) {
      return NextResponse.json(
        { error: "Labngganan tidak ditemukan." },
        { status: 404 }
      );
    }
    await deactivateSubscription(params.id);

    return NextResponse.json({ message: "Langganan berhasil dinonaktifkan." });
  } catch (error) {
    console.error("[PATCH][ACTIVATE]", error);
    return NextResponse.json(
      { error: "Gagal nonaktifkan langganan." },
      { status: 500 }
    );
  }
}
