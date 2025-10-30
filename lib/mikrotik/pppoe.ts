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
  const { connection, close } = await createRouterOSConnection(config);

  try {
    const params = [
      `=name=${user.name}`,
      `=password=${user.password}`,
      `=service=pppoe`,
      `=profile=${user.profile}`,
    ];

    if (user.localAddress) {
      params.push(`=local-address=${user.localAddress}`);
    }

    await connection.write("/ppp/secret/add", params);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? "Unknown error");
    throw new Error(`Gagal membuat user PPPoE: ${message}`);
  } finally {
    await close();
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
  const { connection, close } = await createRouterOSConnection(config);

  try {
    const secret = await findSecretByName(connection, username);
    if (!secret) {
      throw new Error(`User PPPoE "${username}" tidak ditemukan`);
    }

    const identifier =
      toStringValue(secret[".id"]) || toStringValue(secret["name"]);

    await connection.write("/ppp/secret/remove", [`=numbers=${identifier}`]);

    console.log("Berhasil menghapus user PPPoE:", username);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? "Unknown error");
    throw new Error(`Gagal menghapus user PPPoE: ${message}`);
  } finally {
    await close();
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
  const { connection, close } = await createRouterOSConnection(config);

  try {
    const secret = await findSecretByName(connection, user.name);
    if (!secret) {
      throw new Error(`User PPPoE "${user.name}" tidak ditemukan`);
    }

    const identifier =
      toStringValue(secret[".id"]) || toStringValue(secret["name"]);

    await connection.write("/ppp/secret/set", [
      `=.id=${identifier}`,
      `=profile=${user.profile}`,
    ]);

    console.log(
      `Berhasil memindahkan user ${user.name} ke profile ${user.profile}`
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? "Unknown error");
    throw new Error(`Gagal memindahkan user PPPoE: ${message}`);
  } finally {
    await close();
  }
}
