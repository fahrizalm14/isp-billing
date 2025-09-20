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

    const { getInterface } = await import("@/lib/mikrotik/connection");

    const result = await getInterface({
      host: router.ipAddress,
      username: router.apiUsername,
      password: decrypt(router.apiPassword),
      port: Number(router.port),
    });

    const output = result.stdout;
    const nameRegex = /name="([^"]+)"/g;

    const interfaces = new Set<string>();
    let match;
    while ((match = nameRegex.exec(output)) !== null) {
      interfaces.add(match[1]); // Set otomatis menghapus duplikat
    }

    return NextResponse.json({
      success: true,
      interfaces: Array.from(interfaces),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch interfaces", detail: String(err) },
      { status: 500 }
    );
  }
}
