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

/**
 * Ambil profil PPPoE berdasarkan nama
 * @param config Konfigurasi SSH ke MikroTik
 * @param profileName Nama profil PPPoE yang ingin diambil
 * @returns objek profil atau null jika tidak ditemukan
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
} | null> {
  const ssh = new NodeSSH();

  await ssh.connect({
    host: config.host,
    username: config.username,
    password: config.password,
    port: config.port,
    tryKeyboard: true,
  });

  const result = await ssh.execCommand(
    `/ppp profile print where name="${profileName}"`
  );

  if (result.stderr) {
    ssh.dispose();
    throw new Error(`Gagal mengambil profil PPPoE: ${result.stderr}`);
  }

  const stdout = result.stdout || "";
  if (!stdout.trim()) {
    ssh.dispose();
    return null;
  }

  // Cari baris yang berisi entry (mis. "0   name="... local-address=... remote-address=... rate-limit=...")
  const lineMatch = stdout.match(/^\s*\d+\s+(.*)$/m);
  const rawLine = lineMatch ? lineMatch[1] : stdout.split("\n").join(" ");

  // Parse pasangan key=value (mendukung nilai ber-quote atau tidak)
  const attrs: Record<string, string> = {};
  const re = /([^\s=]+)=("([^"]*)"|[^\s"]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rawLine))) {
    const key = m[1];
    const val = m[3] ?? m[2];
    // Trim surrounding quotes jika ada
    attrs[key] = String(val).replace(/^"(.*)"$/, "$1");
  }

  ssh.dispose();

  return {
    name: attrs["name"],
    localAddress: attrs["local-address"],
    remoteAddress: attrs["remote-address"],
    rateLimit: attrs["rate-limit"],
    raw: rawLine.trim(),
  };
}

/**
 * Ambil semua profil PPPoE
 * @param config Konfigurasi SSH ke MikroTik
 * @returns array profil (bisa kosong)
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
  const ssh = new NodeSSH();

  await ssh.connect({
    host: config.host,
    username: config.username,
    password: config.password,
    port: config.port,
    tryKeyboard: true,
  });

  const result = await ssh.execCommand(`/ppp profile print`);

  if (result.stderr) {
    ssh.dispose();
    throw new Error(`Gagal mengambil daftar profil PPPoE: ${result.stderr}`);
  }

  const stdout = result.stdout || "";
  if (!stdout.trim()) {
    ssh.dispose();
    return [];
  }

  // Ambil setiap baris entry yang dimulai dengan index (0,1,2,...)
  const entries: string[] = [];
  const lineRe = /^\s*\d+\s+(.*)$/gm;
  let lm: RegExpExecArray | null;
  while ((lm = lineRe.exec(stdout))) {
    entries.push(lm[1]);
  }

  const profiles = entries.map((rawLine) => {
    const attrs: Record<string, string> = {};
    const re = /([^\s=]+)=("([^"]*)"|[^\s"]+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(rawLine))) {
      const key = m[1];
      const val = m[3] ?? m[2];
      attrs[key] = String(val).replace(/^"(.*)"$/, "$1");
    }

    return {
      name: attrs["name"],
      localAddress: attrs["local-address"],
      remoteAddress: attrs["remote-address"],
      rateLimit: attrs["rate-limit"],
      raw: rawLine.trim(),
    };
  });

  ssh.dispose();
  return profiles;
}
