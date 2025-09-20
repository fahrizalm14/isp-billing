import { decrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function parseBandwidth(output: string) {
  const lines = output.split("\n");
  const data: Record<string, string> = {};

  for (const line of lines) {
    const [key, value] = line.split(":").map((part) => part.trim());
    if (key && value) {
      data[key] = value;
    }
  }

  function parseBits(val: string | undefined): number {
    if (!val) return 0;
    const match = val.match(/([\d.]+)\s*(bps|kbps|Mbps|Gbps)/i);
    if (!match) return parseFloat(val) || 0;

    const num = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case "bps":
        return num;
      case "kbps":
        return num * 1_000;
      case "mbps":
        return num * 1_000_000;
      case "gbps":
        return num * 1_000_000_000;
      default:
        return num;
    }
  }

  const rx = parseBits(data["rx-bits-per-second"]);
  const tx = parseBits(data["tx-bits-per-second"]);

  return { rx, tx };
}

export async function GET(req: NextRequest) {
  try {
    const pathParts = req.nextUrl.pathname.split("/");
    const id = pathParts[pathParts.length - 2]; // Ambil ID dari URL path: /api/router/mikrotik/[id]/bandwidth

    const interfaceName = req.nextUrl.searchParams.get("interface") || "ether1";

    const router = await prisma.router.findUnique({
      where: { id },
    });

    if (!router) {
      return NextResponse.json(
        { success: false, message: "Router not found" },
        { status: 404 }
      );
    }

    const { getBandwidth } = await import("@/lib/mikrotik/connection");

    const result = await getBandwidth({
      host: router.ipAddress,
      username: router.apiUsername,
      password: decrypt(router.apiPassword),
      port: Number(router.port),
      params: interfaceName,
    });

    const parsed = parseBandwidth(result.stdout || "");

    return NextResponse.json({
      success: true,
      rx: parsed.rx,
      tx: parsed.tx,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to get bandwidth",
        error: String(err),
      },
      { status: 500 }
    );
  }
}
