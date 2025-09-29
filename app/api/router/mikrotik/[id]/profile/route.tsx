// GET /api/router/[id]/interfaces
import { decrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const pathParts = req.nextUrl.pathname.split("/");
    const id = pathParts[pathParts.length - 2]; // Ambil ID dari URL path: /api/router/mikrotik/[id]/bandwidth
    const router = await prisma.router.findUnique({
      where: { id },
    });

    if (!router) {
      return NextResponse.json({ error: "Router not found" }, { status: 404 });
    }

    const { getAllPppoeProfiles } = await import("@/lib/mikrotik/profile");

    const result = await getAllPppoeProfiles({
      host: router.ipAddress,
      username: router.apiUsername,
      password: decrypt(router.apiPassword),
      port: Number(router.port),
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch interfaces", detail: String(err) },
      { status: 500 }
    );
  }
}
