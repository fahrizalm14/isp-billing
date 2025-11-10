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
  const queries = [username];
  const profileKey = toProfileKey(username);
  if (profileKey !== username) {
    queries.push(profileKey);
  }

  for (const query of queries) {
    const result = await executeCommand(connection, "/ppp/secret/print", [
      `?name=${query}`,
    ]);
    if (result.code === 0 && result.data.length) {
      return result.data[0];
    }
  }

  return undefined;
};

const resolveProfileName = async (
  connection: RouterOSConnection,
  profile: string
) => {
  const normalized = (profile || "").trim();
  if (!normalized) {
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

  for (const candidate of candidates) {
    const result = await executeCommand(connection, "/ppp/profile/print", [
      `?name=${candidate}`,
    ]);
    if (result.code === 0 && result.data.length > 0) {
      const record = result.data[0];
      const name = toStringValue(record["name"]);
      return name || candidate;
    }
  }

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

    const secret = await findSecretByName(connection, user.name);
    if (!secret) {
      throw new Error(`User PPPoE "${user.name}" tidak ditemukan`);
    }

    const identifier =
      toStringValue(secret[".id"]) || toStringValue(secret["name"]);

    const targetProfile = await resolveProfileName(connection, user.profile);
    if (!targetProfile) {
      throw new Error(
        `Profil PPPoE "${user.profile}" tidak ditemukan di MikroTik`
      );
    }

    // RouterOS 7 lebih baik menggunakan numbers parameter untuk set command
    const result = await executeCommand(connection, "/ppp/secret/set", [
      `=numbers=${identifier}`,
      `=profile=${targetProfile}`,
    ]);

    if (result.code !== 0) {
      throw new Error(result.stderr || "Gagal mengupdate PPPoE secret");
    }

    console.log(
      `✅ Berhasil memindahkan user ${user.name} ke profile ${targetProfile}`
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? "Unknown error");
    throw new Error(`Gagal memindahkan user PPPoE: ${message}`);
  } finally {
    if (close) {
      await close();
    }
  }
}
