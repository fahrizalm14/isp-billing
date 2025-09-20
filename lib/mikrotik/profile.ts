export const runtime = "nodejs";

import { toProfileKey } from "./adapator";
const { NodeSSH } = await import("node-ssh");

/**
 * Membuat profile PPPoE baru di MikroTik
 * @param {Object} config - Konfigurasi koneksi dan profil
 * @param {string} config.host - IP address MikroTik
 * @param {string} config.username - Username login SSH
 * @param {string} config.password - Password login SSH
 * @param {Object} profile - Data profil PPPoE
 * @param {string} profile.name - Nama profil
 * @param {string} profile.localAddress - Alamat lokal
 * @param {string} profile.remoteAddress - Pool untuk remote IP
 * @param {string} profile.rateLimit - Limitasi kecepatan (contoh: "2M/2M")
 */

export async function createProfilePPPOE(
  config: {
    host: string;
    username: string;
    password: string;
    port: number; // Optional port, default is 22
  },
  profile: {
    name: string;
    localAddress: string;
    remoteAddress: string;
    rateLimit: string;
  }
) {
  const ssh = new NodeSSH();
  // try {
  const command = `ppp profile add name=${toProfileKey(
    profile.name
  )} local-address=${toProfileKey(
    profile.localAddress
  )} remote-address=${toProfileKey(profile.remoteAddress)} rate-limit=${
    profile.rateLimit
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
    throw new Error(`Gagal menambahkan profil PPPoE: ${result.stderr}`);
  }

  ssh.dispose();

  //   console.log("Berhasil membuat profil PPPoE:", result.stdout);
  // } catch (err) {
  //   if (err instanceof Error) {
  //     console.error("Terjadi kesalahan:", err.message);
  //     throw new Error(`Gagal membuat profil PPPoE: ${err.message}`);
  //   } else {
  //     console.error("Terjadi kesalahan:", err);
  //     throw new Error("Gagal membuat profil PPPoE: Unknown error");
  //   }
  // } finally {
  //   ssh.dispose();
  // }
}

/**
 * Menghapus profil PPPoE berdasarkan nama
 * @param config Konfigurasi SSH ke MikroTik
 * @param profileName Nama profil PPPoE yang ingin dihapus
 */
export async function deletePppoeProfile(
  config: { host: string; username: string; password: string; port: number },
  profileName: string
) {
  const { NodeSSH } = await import("node-ssh");
  const ssh = new NodeSSH();
  // try {
  await ssh.connect({
    host: config.host,
    username: config.username,
    password: config.password,
    port: config.port,
    tryKeyboard: true,
  });

  // Cari ID profile berdasarkan nama
  const findResult = await ssh.execCommand(
    `/ppp profile print where name="${profileName}"`
  );

  const match = findResult.stdout.match(/^\s*(\d+)\s+name="/m);
  if (!match) {
    console.log(`Profil "${profileName}" tidak ditemukan.`);
    return;
  }

  const id = match[1];

  // Hapus berdasarkan ID
  const deleteResult = await ssh.execCommand(`/ppp profile remove ${id}`);
  console.log("Hasil penghapusan:", deleteResult.stdout);

  if (deleteResult.stderr) {
    throw new Error(`Gagal menghapus profil: ${deleteResult.stderr}`);
  }

  ssh.dispose();

  console.log(`Profil "${profileName}" berhasil dihapus.`);
  // } catch (err) {
  //   if (err instanceof Error) {
  //     console.error("Terjadi kesalahan:", err.message);
  //   } else {
  //     console.error("Terjadi kesalahan:", err);
  //   }
  // } finally {
  //   ssh.dispose();
  // }
}
