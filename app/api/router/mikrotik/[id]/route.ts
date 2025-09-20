import { decrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  let id = "";
  try {
    const params = await context.params;
    id = params.id; // ini boleh karena context sudah di-*await*

    const router = await prisma.router.findUnique({
      where: { id },
    });

    if (!router) {
      return NextResponse.json(
        { success: false, message: "Router not found" },
        { status: 404 }
      );
    }

    const { tesConnection } = await import("@/lib/mikrotik/connection");

    await tesConnection({
      host: router.ipAddress,
      username: router.apiUsername,
      password: decrypt(router.apiPassword),
      port: Number(router.port),
    });

    await prisma.router.update({
      where: { id },
      data: { status: true },
    });
    return NextResponse.json({
      success: true,
      message: "SSH connection successful",
    });
  } catch (err) {
    await prisma.router.update({
      where: { id },
      data: { status: false },
    });
    return NextResponse.json(
      {
        success: false,
        message: "SSH connection failed",
        error: String(err),
      },
      { status: 500 }
    );
  }
}
