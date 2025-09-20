// app/api/router/[id]/pools/route.ts
import { decrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function getLocalAddressFromPoolRange(poolRange: string): string | null {
  // Misal poolRange = "192.168.10.2-192.168.10.254"
  const ipStart = poolRange.split("-")[0];
  const parts = ipStart.split(".");
  if (parts.length !== 4) return null;
  return `${parts[0]}.${parts[1]}.${parts[2]}.1`; // Jadi .1
}

function parseAssignedIps(output: string): string[] {
  // Parsing dari /ip address print tanpa paging
  // Cari semua IP tanpa subnet mask, misal: 192.168.10.1/24 -> 192.168.10.1
  const ipRegex = /address=([\d\.]+)\/\d+/g;
  const ips: string[] = [];
  let match;
  while ((match = ipRegex.exec(output)) !== null) {
    ips.push(match[1]);
  }
  return ips;
}

export async function GET(req: NextRequest) {
  try {
    const pathParts = req.nextUrl.pathname.split("/");
    const id = pathParts[pathParts.length - 2]; // /api/router/[id]/pools

    const router = await prisma.router.findUnique({
      where: { id },
    });

    if (!router) {
      return NextResponse.json({ error: "Router not found" }, { status: 404 });
    }

    const { getPools } = await import("@/lib/mikrotik/connection");

    const { ipResult, poolResult } = await getPools({
      host: router.ipAddress,
      username: router.apiUsername,
      password: decrypt(router.apiPassword),
      port: Number(router.port),
    });

    if (poolResult.code !== 0) {
      return NextResponse.json(
        { error: "Failed to get pools", detail: poolResult.stderr },
        { status: 500 }
      );
    }

    if (ipResult.code !== 0) {
      return NextResponse.json(
        { error: "Failed to get assigned IPs", detail: ipResult.stderr },
        { status: 500 }
      );
    }

    const pools: {
      name: string;
      ranges: string;
      localAddress: string | null;
    }[] = [];
    const assignedIps = parseAssignedIps(ipResult.stdout);

    const poolRegex = /name="([^"]+)"\s+ranges=([^\s]+)/g;
    let match;
    while ((match = poolRegex.exec(poolResult.stdout)) !== null) {
      const name = match[1];
      const ranges = match[2];
      const localAddress = getLocalAddressFromPoolRange(ranges);

      // Validasi localAddress ada di assigned IP router
      const isValidLocalAddress =
        localAddress && assignedIps.includes(localAddress);

      pools.push({
        name,
        ranges,
        localAddress: isValidLocalAddress ? localAddress : null,
      });
    }

    return NextResponse.json({
      success: true,
      pools,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch pools", detail: String(err) },
      { status: 500 }
    );
  }
}
