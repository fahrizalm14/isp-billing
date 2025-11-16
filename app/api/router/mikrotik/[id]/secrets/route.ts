import { decrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const toStringValue = (value: unknown) =>
  value === null || value === undefined ? "" : String(value);

type SecretStatus = "active" | "inactive";

const mapSecretRecords = (
  records: Record<string, string>[],
  status: SecretStatus
) =>
  records.map((secret) => {
    const username =
      toStringValue(secret["name"]) ||
      toStringValue(secret["user"]) ||
      toStringValue(secret["username"]);

    return {
      id: toStringValue(secret[".id"]),
      username,
      password: toStringValue(secret["password"]),
      profile: toStringValue(secret["profile"]),
      service: toStringValue(secret["service"]),
      comment: toStringValue(secret["comment"]),
      lastLoggedOut:
        toStringValue(secret["last-logged-out"]) ||
        toStringValue(secret["last-logout"]) ||
        null,
      status,
    };
  });

export async function GET(req: NextRequest) {
  try {
    const pathParts = req.nextUrl.pathname.split("/");
    const routerId = pathParts[pathParts.length - 2];

    const router = await prisma.router.findUnique({
      where: { id: routerId },
    });

    if (!router) {
      return NextResponse.json(
        { error: "Router tidak ditemukan" },
        { status: 404 }
      );
    }

    // Dynamic import untuk menghindari masalah di production
    const { createRouterOSConnection } = await import("@/lib/mikrotik/client");
    const { getSecretsStatus } = await import("@/lib/mikrotik/connection");
    const password = decrypt(router.apiPassword);

    const { connection, close } = await createRouterOSConnection({
      host: router.ipAddress,
      username: router.apiUsername,
      password,
      port: Number(router.port),
    });

    try {
      const secrets = await getSecretsStatus(connection);

      return NextResponse.json({
        success: true,
        secrets: {
          active: mapSecretRecords(secrets.active, "active"),
          inactive: mapSecretRecords(secrets.inactive, "inactive"),
        },
      });
    } finally {
      await close();
    }
  } catch (error) {
    console.error(`[GET][ROUTER][SECRETS]`, error);
    return NextResponse.json(
      { error: "Gagal mengambil data PPPoE secrets", detail: String(error) },
      { status: 500 }
    );
  }
}
