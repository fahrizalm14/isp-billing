// app/api/router/[id]/pools/route.ts
import { decrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const toStringValue = (value: unknown) =>
  value === null || value === undefined ? "" : String(value);

function getLocalAddressFromPoolRange(poolRange: string): string | null {
  // Misal poolRange = "192.168.10.2-192.168.10.254"
  const ipStart = poolRange.split("-")[0];
  const parts = ipStart.split(".");
  if (parts.length !== 4) return null;
  return `${parts[0]}.${parts[1]}.${parts[2]}.1`; // Jadi .1
}

function parseAssignedIps(
  rows: Array<Record<string, unknown>>
): string[] {
  return rows
    .map((row) => toStringValue(row["address"]))
    .filter((address) => address.includes("/"))
    .map((address) => address.split("/")[0])
    .filter(Boolean);
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

    const assignedIps = parseAssignedIps(ipResult.data);

    const pools = poolResult.data.map((row) => {
      const name = toStringValue(row["name"]);
      const ranges = toStringValue(row["ranges"]);
      const localAddress = getLocalAddressFromPoolRange(ranges);
      const isValidLocalAddress =
        localAddress && assignedIps.includes(localAddress);

      return {
        name,
        ranges,
        localAddress: isValidLocalAddress ? localAddress : null,
      };
    });

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
