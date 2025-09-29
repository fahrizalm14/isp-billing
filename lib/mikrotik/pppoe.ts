export const runtime = "nodejs";

import { toProfileKey } from "./adapator";
const { NodeSSH } = await import("node-ssh");

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
  const ssh = new NodeSSH();
  try {
    const command1 = `/ppp secret add name=${user.name} password=${
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

    let result = await ssh.execCommand(command1);

    // fallback: coba dengan nilai di-quote (RouterOS versi/format berbeda)
    if (result.stderr) {
      const command2 = `/ppp secret add name="${user.name}" password="${
        user.password
      }" service=pppoe profile="${user.profile}"${
        user.localAddress ? ` local-address="${user.localAddress}"` : ""
      }`;
      result = await ssh.execCommand(command2);
    }

    if (result.stderr) {
      throw new Error(`Gagal membuat user PPPoE: ${result.stderr}`);
    }
  } finally {
    ssh.dispose();
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
  const ssh = new NodeSSH();
  try {
    const command1 = `/ppp secret remove [find name=${toProfileKey(username)}]`;

    await ssh.connect({
      host: config.host,
      username: config.username,
      password: config.password,
      port: config.port,
      tryKeyboard: true,
    });

    let result = await ssh.execCommand(command1);

    // fallback: coba dengan name asli / di-quote
    if (result.stderr) {
      const command2 = `/ppp secret remove [find name="${username}"]`;
      result = await ssh.execCommand(command2);
    }

    // fallback lain: cari id lalu remove berdasarkan id
    if (result.stderr) {
      const findRes = await ssh.execCommand(
        `/ppp secret print where name="${username}"`
      );
      const match = (findRes.stdout || "").match(/^\s*(\d+)\s+/m);
      if (match) {
        const id = match[1];
        result = await ssh.execCommand(`/ppp secret remove ${id}`);
      }
    }

    if (result.stderr) {
      throw new Error(`Gagal menghapus user PPPoE: ${result.stderr}`);
    }

    // tetap logging seperti sebelumnya
    console.log("Berhasil menghapus user PPPoE:", result.stdout);
  } finally {
    ssh.dispose();
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
  const ssh = new NodeSSH();
  try {
    const command1 = `/ppp secret set [find name=${user.name}] profile=${user.profile}`;

    await ssh.connect({
      host: config.host,
      username: config.username,
      password: config.password,
      port: config.port,
      tryKeyboard: true,
    });

    let result = await ssh.execCommand(command1);

    if (result.stderr) {
      // fallback dengan quoting
      const command2 = `/ppp secret set [find name="${user.name}"] profile="${user.profile}"`;
      result = await ssh.execCommand(command2);
    }

    if (result.stderr) {
      throw new Error(`Gagal memindahkan user PPPoE: ${result.stderr}`);
    }

    console.log(
      `Berhasil memindahkan user ${user.name} ke profile ${user.profile}:`,
      result.stdout
    );
  } finally {
    ssh.dispose();
  }
}
