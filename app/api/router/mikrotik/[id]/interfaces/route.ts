// GET /api/router/[id]/interfaces
import { decrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const toStringValue = (value: unknown) =>
  value === null || value === undefined ? "" : String(value);

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

    const interfaceNames = result.result.data
      .map(
        (row) =>
          toStringValue(row["name"]) || toStringValue(row["default-name"])
      )
      .filter(Boolean);
    const interfaces = Array.from(new Set(interfaceNames));

    return NextResponse.json({
      success: true,
      interfaces: Array.from(interfaces),
      systemInfo: result.systemInfo,
      secrets: result.secrets,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch interfaces", detail: String(err) },
      { status: 500 }
    );
  }
}
