export const runtime = "nodejs";

import { toProfileKey } from "./adapator";
const { NodeSSH } = await import("node-ssh");

/**
 * Membuat profile PPPoE baru di MikroTik
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
  try {
    const command1 = `ppp profile add name=${toProfileKey(
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

    let result = await ssh.execCommand(command1);

    // fallback: pakai nilai asli (tanpa toProfileKey) dan dengan quoting
    if (result.stderr) {
      const command2 = `ppp profile add name="${profile.name}" local-address="${profile.localAddress}" remote-address="${profile.remoteAddress}" rate-limit="${profile.rateLimit}"`;
      result = await ssh.execCommand(command2);
    }

    if (result.stderr) {
      throw new Error(`Gagal menambahkan profil PPPoE: ${result.stderr}`);
    }
  } finally {
    ssh.dispose();
  }
}

/**
 * Menghapus profil PPPoE berdasarkan nama
 */
export async function deletePppoeProfile(
  config: { host: string; username: string; password: string; port: number },
  profileName: string
) {
  const { NodeSSH } = await import("node-ssh");
  const ssh = new NodeSSH();
  try {
    await ssh.connect({
      host: config.host,
      username: config.username,
      password: config.password,
      port: config.port,
      tryKeyboard: true,
    });

    // Coba cari dengan perintah sederhana
    let findResult = await ssh.execCommand(
      `/ppp profile print where name="${profileName}"`
    );

    // Jika tidak ditemukan atau format berbeda, coba print detail dan cari id
    let match = (findResult.stdout || "").match(/^\s*(\d+)\s+name="/m);
    if (!match) {
      const detailRes = await ssh.execCommand(
        `/ppp profile print detail where name="${profileName}"`
      );
      // coba cari "0   name="... atau cari index di awal baris
      match = (detailRes.stdout || "").match(/^\s*(\d+)\s+/m);
      if (!match) {
        // fallback: coba remove langsung via [find name="..."]
        const deleteDirect = await ssh.execCommand(
          `/ppp profile remove [find name="${profileName}"]`
        );
        if (deleteDirect.stderr) {
          throw new Error(`Gagal menghapus profil: ${deleteDirect.stderr}`);
        }
        ssh.dispose();
        console.log(`Profil "${profileName}" berhasil dihapus.`);
        return;
      } else {
        findResult = detailRes;
      }
    }

    const id = match[1];

    // Hapus berdasarkan ID
    const deleteResult = await ssh.execCommand(`/ppp profile remove ${id}`);
    console.log("Hasil penghapusan:", deleteResult.stdout);

    if (deleteResult.stderr) {
      throw new Error(`Gagal menghapus profil: ${deleteResult.stderr}`);
    }

    console.log(`Profil "${profileName}" berhasil dihapus.`);
  } finally {
    ssh.dispose();
  }
}

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
} | null> {
  const ssh = new NodeSSH();

  await ssh.connect({
    host: config.host,
    username: config.username,
    password: config.password,
    port: config.port,
    tryKeyboard: true,
  });

  // coba bentuk ringkas dulu
  let result = await ssh.execCommand(
    `/ppp profile print where name="${profileName}"`
  );

  if (result.stderr) {
    // fallback: coba detail tanpa-paging atau tanpa modifier
    result = await ssh.execCommand(
      `/ppp profile print detail where name="${profileName}"`
    );
    if (result.stderr) {
      ssh.dispose();
      throw new Error(`Gagal mengambil profil PPPoE: ${result.stderr}`);
    }
  }

  const stdout = result.stdout || "";
  if (!stdout.trim()) {
    ssh.dispose();
    return null;
  }

  // Pertama coba parse single-line index-format
  const lineMatch = stdout.match(/^\s*\d+\s+(.*)$/m);
  let rawLine = lineMatch ? lineMatch[1] : "";

  // Jika tidak ketemu, coba parse detail dengan format "key: value" (RouterOS detail)
  if (!rawLine) {
    const lines = stdout
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length > 0 && lines[0].includes(":")) {
      const attrs: Record<string, string> = {};
      for (const line of lines) {
        const m = line.match(/^([^:]+):\s*(.*)$/);
        if (m) attrs[m[1].trim()] = m[2].trim().replace(/^"(.*)"$/, "$1");
      }
      ssh.dispose();
      return {
        name: attrs["name"],
        localAddress: attrs["local-address"],
        remoteAddress: attrs["remote-address"],
        rateLimit: attrs["rate-limit"],
        raw: lines.join(" "),
      };
    } else {
      // fallback: gunakan seluruh stdout sebagai raw
      rawLine = stdout.split("\n").join(" ");
    }
  }

  // Parse pasangan key=value (mendukung nilai ber-quote atau tidak)
  const attrs: Record<string, string> = {};
  const re = /([^\s=]+)=("([^"]*)"|[^\s"]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(rawLine))) {
    const key = m[1];
    const val = m[3] ?? m[2];
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

  let result = await ssh.execCommand(`/ppp profile print`);

  if (result.stderr) {
    // fallback: detail full (mungkin format berbeda)
    result = await ssh.execCommand(`/ppp profile print detail without-paging`);
    if (result.stderr) {
      result = await ssh.execCommand(`/ppp profile print detail`);
    }
  }

  if (result.stderr) {
    ssh.dispose();
    throw new Error(`Gagal mengambil daftar profil PPPoE: ${result.stderr}`);
  }

  const stdout = result.stdout || "";
  if (!stdout.trim()) {
    ssh.dispose();
    return [];
  }

  // Pertama coba format index-lines
  const entries: string[] = [];
  const lineRe = /^\s*\d+\s+(.*)$/gm;
  let lm: RegExpExecArray | null;
  while ((lm = lineRe.exec(stdout))) {
    entries.push(lm[1]);
  }

  // Jika tidak ada entries, coba parse blocks key: value (detail mode)
  if (entries.length === 0) {
    const blocks = stdout
      .split(/\r?\n\r?\n/)
      .map((b) => b.trim())
      .filter(Boolean);
    for (const b of blocks) {
      // jika b berformat "key: value" per baris
      if (b.includes(":")) {
        const attrs: Record<string, string> = {};
        for (const line of b.split(/\r?\n/)) {
          const m = line.match(/^([^:]+):\s*(.*)$/);
          if (m) attrs[m[1].trim()] = m[2].trim().replace(/^"(.*)"$/, "$1");
        }
        const rawLine = Object.entries(attrs)
          .map(([k, v]) => `${k}=${v}`)
          .join(" ");
        entries.push(rawLine);
      } else {
        // fallback: tambahkan seluruh block sebagai raw
        entries.push(b.replace(/\r?\n/g, " "));
      }
    }
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
