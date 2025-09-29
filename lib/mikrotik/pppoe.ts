export const runtime = "nodejs";

import { toProfileKey } from "./adapator";
const { NodeSSH } = await import("node-ssh");

/**
 * Membuat user PPPoE baru di MikroTik
 * @param {Object} config - Konfigurasi koneksi SSH
 * @param {string} config.host - IP address MikroTik
 * @param {string} config.username - Username login SSH
 * @param {string} config.password - Password login SSH
 * @param {number} config.port - Port SSH (default 22)
 * @param {Object} user - Data user PPPoE
 * @param {string} user.name - Username PPPoE
 * @param {string} user.password - Password PPPoE
 * @param {string} user.service - Jenis layanan (contoh: "pppoe")
 * @param {string} user.profile - Profil PPPoE yang digunakan
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
  const ssh = new NodeSSH();
  // try {
  const command = `/ppp secret add name=${user.name} password=${
    user.password
  } service=${"pppoe"} profile=${user.profile}${
    user.localAddress ? ` local-address=${user.localAddress}` : ""
  }`;

  await ssh.connect({
    host: config.host,
    username: config.username,
    password: config.password,
    port: config.port,
    tryKeyboard: true,
  });

  const result = await ssh.execCommand(command);

  if (result.stderr) {
    throw new Error(`Gagal membuat user PPPoE: ${result.stderr}`);
  }

  ssh.dispose();

  // console.log("Berhasil membuat user PPPoE:", result.stdout);
  // } catch (err) {
  //   if (err instanceof Error) {
  //     console.error("Terjadi kesalahan:", err.message);
  //     throw new Error(`Gagal membuat user PPPoE: ${err.message}`);
  //   } else {
  //     console.error("Terjadi kesalahan:", err);
  //     throw new Error("Gagal membuat user PPPoE: Unknown error");
  //   }
  // } finally {
  //   ssh.dispose();
  // }
}

/**
 * Menghapus user PPPoE dari MikroTik
 * @param {Object} config - Konfigurasi koneksi SSH
 * @param {string} config.host - IP address MikroTik
 * @param {string} config.username - Username login SSH
 * @param {string} config.password - Password login SSH
 * @param {number} config.port - Port SSH (default 22)
 * @param {string} username - Nama user PPPoE yang ingin dihapus
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
  const ssh = new NodeSSH();
  // try {
  const command = `/ppp secret remove [find name=${toProfileKey(username)}]`;

  await ssh.connect({
    host: config.host,
    username: config.username,
    password: config.password,
    port: config.port,
    tryKeyboard: true,
  });

  const result = await ssh.execCommand(command);

  if (result.stderr) {
    throw new Error(`Gagal menghapus user PPPoE: ${result.stderr}`);
  }

  console.log("Berhasil menghapus user PPPoE:", result.stdout);
  ssh.dispose();

  // } catch (err) {
  //   if (err instanceof Error) {
  //     console.error("Terjadi kesalahan:", err.message);
  //     throw new Error(`Gagal menghapus user PPPoE: ${err.message}`);
  //   } else {
  //     console.error("Terjadi kesalahan:", err);
  //     throw new Error("Gagal menghapus user PPPoE: Unknown error");
  //   }
  // } finally {
  //   ssh.dispose();
  // }
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
  const ssh = new NodeSSH();
  // try {
  const command = `/ppp secret set [find name=${user.name}] profile=${user.profile}`;

  await ssh.connect({
    host: config.host,
    username: config.username,
    password: config.password,
    port: config.port,
    tryKeyboard: true,
  });

  const result = await ssh.execCommand(command);

  if (result.stderr) {
    throw new Error(`Gagal memindahkan user PPPoE: ${result.stderr}`);
  }

  console.log(
    `Berhasil memindahkan user ${user.name} ke profile ${user.profile}:`,
    result.stdout
  );
  ssh.dispose();
}
