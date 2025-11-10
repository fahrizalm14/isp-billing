export const runtime = "nodejs";

import { toProfileKey } from "./adapator";
import {
  RouterOSConnection,
  createRouterOSConnection,
  executeCommand,
} from "./client";

const toStringValue = (value: unknown) =>
  value === null || value === undefined ? "" : String(value);

const findSecretByName = async (
  connection: RouterOSConnection,
  username: string
) => {
  console.log("🔍 [FIND_SECRET] Searching for PPPoE secret:", username);

  const queries = [username];
  const profileKey = toProfileKey(username);
  if (profileKey !== username) {
    queries.push(profileKey);
  }

  console.log("🔍 [FIND_SECRET] Query variations:", queries);

  for (const query of queries) {
    console.log(`🔍 [FIND_SECRET] Trying query: ${query}`);
    const startQuery = Date.now();
    const result = await executeCommand(connection, "/ppp/secret/print", [
      `?name=${query}`,
    ]);
    console.log(
      `🔍 [FIND_SECRET] Query completed (${Date.now() - startQuery}ms):`,
      {
        code: result.code,
        found: result.data.length > 0,
      }
    );

    if (result.code === 0 && result.data.length) {
      console.log("✅ [FIND_SECRET] Secret found:", result.data[0]);
      return result.data[0];
    }
  }

  console.log("❌ [FIND_SECRET] Secret not found for any query variation");
  return undefined;
};

const resolveProfileName = async (
  connection: RouterOSConnection,
  profile: string
) => {
  console.log("🔍 [RESOLVE_PROFILE] Resolving profile name:", profile);

  const normalized = (profile || "").trim();
  if (!normalized) {
    console.log("❌ [RESOLVE_PROFILE] Empty profile name provided");
    return undefined;
  }

  const candidates = [normalized];
  const keyed = toProfileKey(normalized);
  if (keyed && !candidates.includes(keyed)) {
    candidates.push(keyed);
  }
  const lower = normalized.toLowerCase();
  if (lower && !candidates.includes(lower)) {
    candidates.push(lower);
  }

  console.log("🔍 [RESOLVE_PROFILE] Profile name variations:", candidates);

  for (const candidate of candidates) {
    console.log(`🔍 [RESOLVE_PROFILE] Trying candidate: ${candidate}`);
    const startQuery = Date.now();
    const result = await executeCommand(connection, "/ppp/profile/print", [
      `?name=${candidate}`,
    ]);
    console.log(
      `🔍 [RESOLVE_PROFILE] Query completed (${Date.now() - startQuery}ms):`,
      {
        code: result.code,
        found: result.data.length > 0,
      }
    );

    if (result.code === 0 && result.data.length > 0) {
      const record = result.data[0];
      const name = toStringValue(record["name"]);
      console.log("✅ [RESOLVE_PROFILE] Profile found:", name || candidate);
      return name || candidate;
    }
  }

  console.log("❌ [RESOLVE_PROFILE] Profile not found for any variation");
  return undefined;
};

/**
 * Membuat user PPPoE baru di MikroTik
 */
export async function createUserPPPOE(
  config: {
    host: string;
    username: string;
    password: string;
    port: number;
  },
  user: {
    name: string;
    password: string;
    profile: string;
    localAddress?: string;
  }
) {
  let connection: RouterOSConnection | null = null;
  let close: (() => Promise<void>) | null = null;

  try {
    ({ connection, close } = await createRouterOSConnection(config));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? "Unknown error");
    console.log(`Gagal membuat user PPPoE: ${message}`);
    throw new Error(`Gagal terhubung ke MikroTik: ${message}`);
  }

  try {
    if (!connection || !close) {
      throw new Error("Koneksi MikroTik tidak tersedia");
    }

    // ✅ Cek apakah username sudah ada
    const existingSecret = await findSecretByName(connection, user.name);
    if (existingSecret) {
      throw new Error(
        `Username PPPoE "${user.name}" sudah digunakan di MikroTik. Silakan gunakan username lain.`
      );
    }

    const params = [
      `=name=${user.name}`,
      `=password=${user.password}`,
      `=service=pppoe`,
      `=profile=${user.profile}`,
    ];

    // ✅ Hanya set local-address jika berupa IP address valid (bukan nama pool)
    // MikroTik akan otomatis assign IP dari pool yang ada di profile
    if (user.localAddress) {
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
      if (ipRegex.test(user.localAddress.trim())) {
        params.push(`=local-address=${user.localAddress}`);
      } else {
        console.log(
          `⚠️ Skipping local-address "${user.localAddress}" (bukan IP valid, pool akan digunakan dari profile)`
        );
      }
    }

    // Gunakan executeCommand untuk menangani response dengan benar di RouterOS 7
    const result = await executeCommand(connection, "/ppp/secret/add", params);

    if (result.code !== 0) {
      throw new Error(result.stderr || "Gagal membuat PPPoE secret");
    }

    console.log(`✅ Berhasil membuat PPPoE secret baru: ${user.name}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? "Unknown error");
    throw new Error(`Gagal membuat user PPPoE: ${message}`);
  } finally {
    if (close) {
      await close();
    }
  }
}

/**
 * Menghapus user PPPoE dari MikroTik
 */
export async function deleteUserPPPOE(
  config: {
    host: string;
    username: string;
    password: string;
    port: number;
  },
  username: string
) {
  let connection: RouterOSConnection | null = null;
  let close: (() => Promise<void>) | null = null;

  try {
    ({ connection, close } = await createRouterOSConnection(config));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? "Unknown error");
    throw new Error(`Gagal terhubung ke MikroTik: ${message}`);
  }

  try {
    if (!connection || !close) {
      throw new Error("Koneksi MikroTik tidak tersedia");
    }

    const secret = await findSecretByName(connection, username);
    if (!secret) {
      throw new Error(`User PPPoE "${username}" tidak ditemukan`);
    }

    const identifier =
      toStringValue(secret[".id"]) || toStringValue(secret["name"]);

    // Gunakan executeCommand untuk konsistensi dengan RouterOS 7
    const result = await executeCommand(connection, "/ppp/secret/remove", [
      `=numbers=${identifier}`,
    ]);

    if (result.code !== 0) {
      throw new Error(result.stderr || "Gagal menghapus PPPoE secret");
    }

    console.log("Berhasil menghapus user PPPoE:", username);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? "Unknown error");
    throw new Error(`Gagal menghapus user PPPoE: ${message}`);
  } finally {
    if (close) {
      await close();
    }
  }
}

export async function getPPPOESecret(
  config: {
    host: string;
    username: string;
    password: string;
    port: number;
  },
  username: string
) {
  let connection: RouterOSConnection | null = null;
  let close: (() => Promise<void>) | null = null;

  try {
    ({ connection, close } = await createRouterOSConnection(config));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? "Unknown error");
    throw new Error(`Gagal terhubung ke MikroTik: ${message}`);
  }

  try {
    if (!connection || !close) {
      throw new Error("Koneksi MikroTik tidak tersedia");
    }

    const secret = await findSecretByName(connection, username);
    if (!secret) {
      return null;
    }

    return {
      id: toStringValue(secret[".id"]),
      username: toStringValue(secret["name"]) || username,
      password: toStringValue(secret["password"]),
      profile: toStringValue(secret["profile"]),
      service: toStringValue(secret["service"]),
      localAddress: toStringValue(secret["local-address"]),
      comment: toStringValue(secret["comment"]),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? "Unknown error");
    throw new Error(`Gagal mengambil PPPoE secret: ${message}`);
  } finally {
    if (close) {
      await close();
    }
  }
}

/**
 * Mendapatkan statistik bandwidth user PPPoE aktif
 */
export async function getPPPOEActiveStats(
  config: {
    host: string;
    username: string;
    password: string;
    port: number;
  },
  username: string
) {
  let connection: RouterOSConnection | null = null;
  let close: (() => Promise<void>) | null = null;

  try {
    ({ connection, close } = await createRouterOSConnection(config));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? "Unknown error");
    throw new Error(`Gagal terhubung ke MikroTik: ${message}`);
  }

  try {
    if (!connection || !close) {
      throw new Error("Koneksi MikroTik tidak tersedia");
    }

    // Cari user di active connections
    const result = await executeCommand(connection, "/ppp/active/print", [
      `?name=${username}`,
    ]);

    if (result.code !== 0 || !result.data.length) {
      return null; // User tidak sedang aktif/online
    }

    const activeData = result.data[0];

    // Parse bytes to MB/GB
    const parseBytes = (bytes: unknown): number => {
      const value = Number(bytes) || 0;
      return value;
    };

    const bytesIn = parseBytes(activeData["bytes-in"]);
    const bytesOut = parseBytes(activeData["bytes-out"]);

    return {
      username: toStringValue(activeData["name"]) || username,
      address: toStringValue(activeData["address"]),
      uptime: toStringValue(activeData["uptime"]),
      bytesIn,
      bytesOut,
      totalBytes: bytesIn + bytesOut,
      isOnline: true,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? "Unknown error");
    throw new Error(`Gagal mengambil statistik PPPoE: ${message}`);
  } finally {
    if (close) {
      await close();
    }
  }
}

export async function movePPPOEToProfile(
  config: {
    host: string;
    username: string;
    password: string;
    port: number;
  },
  user: {
    name: string;
    profile: string;
  }
) {
  console.log("🔧 [MOVE_PROFILE] Starting profile move operation:", {
    username: user.name,
    targetProfile: user.profile,
    router: config.host,
    port: config.port,
  });

  let connection: RouterOSConnection | null = null;
  let close: (() => Promise<void>) | null = null;

  try {
    console.log("🔧 [MOVE_PROFILE] Connecting to MikroTik...");
    const startConnect = Date.now();
    ({ connection, close } = await createRouterOSConnection(config));
    console.log(
      `✅ [MOVE_PROFILE] Connected to MikroTik (${Date.now() - startConnect}ms)`
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? "Unknown error");
    console.error("❌ [MOVE_PROFILE] Connection failed:", message);
    throw new Error(`Gagal terhubung ke MikroTik: ${message}`);
  }

  try {
    if (!connection || !close) {
      console.error(
        "❌ [MOVE_PROFILE] Connection or close function not available"
      );
      throw new Error("Koneksi MikroTik tidak tersedia");
    }

    console.log("🔧 [MOVE_PROFILE] Finding PPPoE secret by username...");
    const startFind = Date.now();
    const secret = await findSecretByName(connection, user.name);
    console.log(
      `✅ [MOVE_PROFILE] Secret lookup completed (${Date.now() - startFind}ms)`
    );

    if (!secret) {
      console.error("❌ [MOVE_PROFILE] PPPoE user not found:", user.name);
      throw new Error(`User PPPoE "${user.name}" tidak ditemukan`);
    }

    const identifier =
      toStringValue(secret[".id"]) || toStringValue(secret["name"]);
    const currentProfile = toStringValue(secret["profile"]);

    console.log("✅ [MOVE_PROFILE] PPPoE user found:", {
      id: identifier,
      username: user.name,
      currentProfile,
    });

    console.log("🔧 [MOVE_PROFILE] Resolving target profile name...");
    const startResolve = Date.now();
    const targetProfile = await resolveProfileName(connection, user.profile);
    console.log(
      `✅ [MOVE_PROFILE] Profile resolution completed (${
        Date.now() - startResolve
      }ms)`
    );

    if (!targetProfile) {
      console.error(
        "❌ [MOVE_PROFILE] Target profile not found:",
        user.profile
      );
      throw new Error(
        `Profil PPPoE "${user.profile}" tidak ditemukan di MikroTik`
      );
    }

    console.log("✅ [MOVE_PROFILE] Target profile resolved:", targetProfile);

    // Check if already in target profile
    if (currentProfile === targetProfile) {
      console.log(
        "ℹ️ [MOVE_PROFILE] User already in target profile, skipping update"
      );
      return;
    }

    // RouterOS 7 lebih baik menggunakan numbers parameter untuk set command
    console.log("🔧 [MOVE_PROFILE] Executing profile change command...");
    const startUpdate = Date.now();
    const result = await executeCommand(connection, "/ppp/secret/set", [
      `=numbers=${identifier}`,
      `=profile=${targetProfile}`,
    ]);
    console.log(
      `✅ [MOVE_PROFILE] Command executed (${Date.now() - startUpdate}ms)`
    );

    if (result.code !== 0) {
      console.error("❌ [MOVE_PROFILE] Command failed:", {
        code: result.code,
        stderr: result.stderr,
        stdout: result.stdout,
      });
      throw new Error(result.stderr || "Gagal mengupdate PPPoE secret");
    }

    console.log(
      `✅ [MOVE_PROFILE] Successfully moved user ${user.name} from "${currentProfile}" to "${targetProfile}"`
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? "Unknown error");
    console.error("❌ [MOVE_PROFILE] Operation failed:", message);
    throw new Error(`Gagal memindahkan user PPPoE: ${message}`);
  } finally {
    if (close) {
      console.log("🔧 [MOVE_PROFILE] Closing MikroTik connection...");
      await close();
      console.log("✅ [MOVE_PROFILE] Connection closed");
    }
  }
}
