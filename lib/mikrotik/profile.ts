export const runtime = "nodejs";

import { toProfileKey } from "./adapator";
import {
  RouterOSConnection,
  createRouterOSConnection,
  executeCommand,
} from "./client";

const toStringValue = (value: unknown) =>
  value === null || value === undefined ? "" : String(value);

const normalizeRecord = (
  record: Record<string, unknown>
): Record<string, string> => {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined || value === null || key === "type") continue;
    normalized[key] = toStringValue(value);
  }
  return normalized;
};

const findProfileByName = async (
  connection: RouterOSConnection,
  profileName: string
) => {
  const candidates = [profileName];
  const keyed = toProfileKey(profileName);
  if (keyed !== profileName) {
    candidates.push(keyed);
  }

  for (const name of candidates) {
    const result = await executeCommand(connection, "/ppp/profile/print", [
      `?name=${name}`,
    ]);
    if (result.code === 0 && result.data.length) {
      return normalizeRecord(result.data[0]);
    }
  }

  return undefined;
};

/**
 * Membuat profile PPPoE baru di MikroTik
 */
// export async function createProfilePPPOE(
//   config: {
//     host: string;
//     username: string;
//     password: string;
//     port: number; // Optional port, default is 22
//   },
//   profile: {
//     name: string;
//     localAddress: string;
//     remoteAddress: string;
//     rateLimit: string;
//   }
// ) {
//   const { connection, close } = await createRouterOSConnection(config);

//   const primaryParams = [
//     `=name=${toProfileKey(profile.name)}`,
//     `=local-address=${toProfileKey(profile.localAddress)}`,
//     `=remote-address=${toProfileKey(profile.remoteAddress)}`,
//     `=rate-limit=${profile.rateLimit}`,
//   ];

//   const fallbackParams = [
//     `=name=${profile.name}`,
//     `=local-address=${profile.localAddress}`,
//     `=remote-address=${profile.remoteAddress}`,
//     `=rate-limit=${profile.rateLimit}`,
//   ];

//   try {
//     try {
//       await connection.write("/ppp/profile/add", primaryParams);
//     } catch {
//       await connection.write("/ppp/profile/add", fallbackParams);
//     }
//   } catch (error) {
//     const message =
//       error instanceof Error ? error.message : String(error ?? "Unknown error");
//     throw new Error(`Gagal menambahkan profil PPPoE: ${message}`);
//   } finally {
//     await close();
//   }
// }

/**
 * Menghapus profil PPPoE berdasarkan nama
 */
// export async function deletePppoeProfile(
//   config: { host: string; username: string; password: string; port: number },
//   profileName: string
// ) {
//   const { connection, close } = await createRouterOSConnection(config);

//   try {
//     const profile = await findProfileByName(connection, profileName);
//     if (!profile) {
//       throw new Error(`Profil "${profileName}" tidak ditemukan`);
//     }

//     const identifier =
//       profile[".id"] && profile[".id"].length > 0
//         ? profile[".id"]
//         : profile["name"];

//     await connection.write("/ppp/profile/remove", [`=numbers=${identifier}`]);
//     console.log(`Profil "${profileName}" berhasil dihapus.`);
//   } catch (error) {
//     const message =
//       error instanceof Error ? error.message : String(error ?? "Unknown error");
//     throw new Error(`Gagal menghapus profil: ${message}`);
//   } finally {
//     await close();
//   }
// }

/**
 * Ambil profil PPPoE berdasarkan nama
 */
export async function getPppoeProfile(
  config: { host: string; username: string; password: string; port: number },
  profileName: string
): Promise<{
  name?: string;
  localAddress?: string;
  remoteAddress?: string;
  rateLimit?: string;
  raw?: string;
}> {
  const { connection, close } = await createRouterOSConnection(config);

  try {
    const profile = await findProfileByName(connection, profileName);
    if (!profile) {
      return {};
    }

    return {
      name: profile["name"],
      localAddress: profile["local-address"],
      remoteAddress: profile["remote-address"],
      rateLimit: profile["rate-limit"],
      raw: Object.entries(profile)
        .map(([key, value]) => `${key}=${value}`)
        .join(" "),
    };
  } finally {
    await close();
  }
}

/**
 * Ambil semua profil PPPoE
 */
export async function getAllPppoeProfiles(config: {
  host: string;
  username: string;
  password: string;
  port: number;
}): Promise<
  Array<{
    name?: string;
    localAddress?: string;
    remoteAddress?: string;
    rateLimit?: string;
    raw?: string;
  }>
> {
  const { connection, close } = await createRouterOSConnection(config);

  try {
    const result = await executeCommand(connection, "/ppp/profile/print");
    if (result.code !== 0) {
      throw new Error(result.stderr || "Gagal mengambil daftar profil PPPoE");
    }

    return result.data.map((record) => {
      const normalized = normalizeRecord(record);
      return {
        name: normalized["name"],
        localAddress: normalized["local-address"],
        remoteAddress: normalized["remote-address"],
        rateLimit: normalized["rate-limit"],
        raw: Object.entries(normalized)
          .map(([key, value]) => `${key}=${value}`)
          .join(" "),
      };
    });
  } finally {
    await close();
  }
}
