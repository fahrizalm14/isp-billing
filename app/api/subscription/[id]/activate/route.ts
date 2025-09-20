import { prisma } from "@/lib/prisma";
import { activateSubscription } from "@/lib/subscription";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const subsToActivate = await prisma.subscription.findUnique({
      where: { id: params.id },
    });

    if (!subsToActivate) {
      return NextResponse.json(
        { error: "Langganan tidak ditemukan." },
        { status: 404 }
      );
    }

    await activateSubscription(
      params.id,
      subsToActivate.dueDate,
      subsToActivate.expiredAt
    );

    return NextResponse.json({ message: "Langganan berhasil diaktifkan." });
  } catch (error) {
    console.error("[PATCH][ACTIVATE]", error);
    return NextResponse.json(
      { error: "Gagal aktifkan langganan." },
      { status: 500 }
    );
  }
}
