export const runtime = "nodejs";

import { NodeSSH } from "node-ssh";
import { MikroTikConfig } from "./type";

export const tesConnection = async ({
  host,
  username,
  password,
  port = 22,
}: MikroTikConfig) => {
  const ssh = new NodeSSH();
  await ssh.connect({
    host,
    username,
    password,
    port,
    tryKeyboard: true,
  });

  ssh.dispose();
};

export const getPools = async ({
  host,
  username,
  password,
  port = 22,
}: MikroTikConfig) => {
  const ssh = new NodeSSH();
  await ssh.connect({
    host,
    username,
    password,
    port,
  });

  // Ambil pools - coba dua variasi perintah (dengan/ tanpa without-paging) sebagai fallback
  let poolResult = await ssh.execCommand(
    `/ip pool print detail without-paging`
  );
  if (poolResult.stderr) {
    poolResult = await ssh.execCommand(`/ip pool print detail`);
  }

  // Ambil assigned IPs - juga coba fallback tanpa modifier
  let ipResult = await ssh.execCommand(
    `/ip address print detail without-paging`
  );
  if (ipResult.stderr) {
    ipResult = await ssh.execCommand(`/ip address print detail`);
  }

  ssh.dispose();

  return {
    poolResult,
    ipResult,
  };
};

export const getBandwidth = async ({
  host,
  username,
  password,
  port = 22,
  params = "",
}: MikroTikConfig) => {
  const ssh = new NodeSSH();
  await ssh.connect({
    host,
    username,
    password,
    port,
  });

  // Coba beberapa varian perintah monitor-traffic untuk kompatibilitas
  let result = await ssh.execCommand(
    `/interface monitor-traffic interface=${params} once`
  );
  if (result.stderr) {
    // fallback: tanpa "interface=" atau dengan posisi once di depan
    result = await ssh.execCommand(`/interface monitor-traffic ${params} once`);
    if (result.stderr) {
      result = await ssh.execCommand(
        `/interface monitor-traffic once interface=${params}`
      );
    }
  }

  ssh.dispose();

  return result;
};

export const getInterface = async ({
  host,
  username,
  password,
  port = 22,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  params = "",
}: MikroTikConfig) => {
  const ssh = new NodeSSH();
  await ssh.connect({
    host,
    username,
    password,
    port,
  });

  // coba tanpa/ dengan without-paging
  let result = await ssh.execCommand("/interface print detail without-paging");
  if (result.stderr || !result.stdout) {
    result = await ssh.execCommand("/interface print detail");
  }

  const systemInfo = await getSystemInfo(ssh);
  const secrets = await getSecretsStatus(ssh);

  ssh.dispose();

  return { result, systemInfo, secrets };
};

export type SystemInfo = {
  boardName: string;
  version: string;
  memory: { totalMB: number; usedMB: number };
  cpuLoad: { load1: number; load5: number; load15: number };
  uptime: string;
};
export async function getSystemInfo(ssh: NodeSSH): Promise<SystemInfo> {
  // helper parse untuk nilai memory RouterOS seperti "5242880KiB" -> MB
  const parseMemToMB = (v: string | undefined) => {
    if (!v) return 0;
    const m = String(v)
      .trim()
      .match(/([\d.]+)\s*([KMGT]?i?B)?/i);
    if (!m) return 0;
    let num = parseFloat(m[1]);
    const unit = (m[2] || "").toUpperCase();
    switch (unit) {
      case "KIB":
      case "KB":
        num = num / 1024;
        break;
      case "MIB":
      case "MB":
        // num = num
        break;
      case "GIB":
      case "GB":
        num = num * 1024;
        break;
      default:
        // assume bytes -> convert to MB
        if (!unit) num = num / (1024 * 1024);
    }
    return Math.round(num);
  };
  // helper format uptime => "Xh Ym"
  const formatUptimeHMFromSeconds = (s: number) => {
    const totalMinutes = Math.floor(s / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}Jam ${minutes}Menit`;
  };

  const parseRouterOSUptimeToHM = (u: string | undefined) => {
    if (!u) return "";
    // match optional weeks, days, hours, minutes, seconds (e.g. "2w3d4h5m6s" or "3d6h12m")
    const m = String(u)
      .trim()
      .match(
        /(?:(\d+)\s*w)?\s*(?:(\d+)\s*d)?\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?/i
      );
    if (!m) return u;
    const weeks = parseInt(m[1] || "0", 10);
    const days = parseInt(m[2] || "0", 10);
    const hours = parseInt(m[3] || "0", 10);
    const minutes = parseInt(m[4] || "0", 10);
    const seconds = parseInt(m[5] || "0", 10);
    const totalSeconds =
      (((weeks * 7 + days) * 24 + hours) * 60 + minutes) * 60 + seconds;
    return formatUptimeHMFromSeconds(totalSeconds);
  };

  // coba RouterOS terlebih dahulu
  const routerRes = await ssh.execCommand(
    "/system resource print without-paging"
  );
  const isRouterOS =
    routerRes.stdout && !/syntax error/i.test(routerRes.stdout);

  if (isRouterOS) {
    const lines = routerRes.stdout
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const map: Record<string, string> = {};
    for (const line of lines) {
      const m = line.match(/^([^:]+):\s*(.+)$/);
      if (m) map[m[1].trim().toLowerCase()] = m[2].trim();
    }

    // boardName: coba dari board-name, platform, atau identity
    let boardName = map["board-name"] || map["platform"] || "";
    if (!boardName) {
      const idRes = await ssh.execCommand(
        "/system identity print without-paging"
      );
      boardName = (idRes.stdout || idRes.stderr || "").trim();
    }

    const version = map["version"] || "";
    const uptime = parseRouterOSUptimeToHM(map["uptime"] || "");

    const totalMB = parseMemToMB(map["total-memory"]);
    const freeMB = parseMemToMB(map["free-memory"]);
    const usedMB = Math.max(0, totalMB - freeMB);

    // robust CPU parsing:
    // 1) cari beberapa kemungkinan nama field
    // 2) ambil angka pertama dari string (mis "1%" -> 1)
    const cpuCandidates = [
      map["cpu"],
      map["cpu-load"],
      map["cpu load"],
      map["cpu%"],
      map["load"],
    ].filter(Boolean) as string[];

    const extractNumber = (s?: string) => {
      if (!s) return 0;
      const mm = String(s).match(/[\d.]+/);
      return mm ? parseFloat(mm[0]) : 0;
    };

    let cpuPercent = cpuCandidates.length
      ? extractNumber(cpuCandidates[0])
      : extractNumber(map["cpu"]);

    // fallback: jika masih 0, coba perintah tanpa modifier atau perintah lain dan parse kembali
    if (!cpuPercent) {
      // coba tanpa-paging (kadang output berbeda)
      try {
        const alt = await ssh.execCommand("/system resource print");
        if (alt.stdout) {
          const altLines = alt.stdout
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean);
          for (const line of altLines) {
            const m = line.match(/^([^:]+):\s*(.+)$/);
            if (m) {
              const key = m[1].trim().toLowerCase();
              const val = m[2].trim();
              if (!map[key]) map[key] = val;
            }
          }
          const altCandidates = [
            map["cpu"],
            map["cpu-load"],
            map["cpu load"],
            map["load"],
          ].filter(Boolean) as string[];
          if (altCandidates.length)
            cpuPercent = extractNumber(altCandidates[0]);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        // ignore, keep cpuPercent as-is
      }
    }

    // ensure numeric and bounded
    cpuPercent = isNaN(cpuPercent) ? 0 : Math.max(0, Math.min(100, cpuPercent));

    const cpuLoad = { load1: cpuPercent, load5: 0, load15: 0 };

    return {
      boardName: boardName.trim(),
      version: version.trim(),
      memory: { totalMB, usedMB },
      cpuLoad,
      uptime: uptime.trim(),
    };
  }

  // fallback ke perintah Linux (existing behaviour)
  const cmds = {
    boardName:
      "sh -c 'cat /proc/device-tree/model 2>/dev/null || cat /sys/firmware/devicetree/base/model 2>/dev/null || hostname'",
    version:
      "sh -c \"grep '^PRETTY_NAME=' /etc/os-release | cut -d= -f2 | tr -d '\\\"' 2>/dev/null || lsb_release -ds 2>/dev/null || uname -sr\"",
    memory: 'sh -c "free -m | awk \'NR==2{printf \\"%d %d\\", $2, $3}\'"',
    cpuLoad: 'cat /proc/loadavg | awk \'{print $1","$2","$3}\'',
    // ubah agar mengembalikan detik agar kita format di JS
    uptime: "awk '{print int($1)}' /proc/uptime",
  };

  const [boardNameRes, versionRes, memoryRes, cpuLoadRes, uptimeRes] =
    await Promise.all([
      ssh.execCommand(cmds.boardName),
      ssh.execCommand(cmds.version),
      ssh.execCommand(cmds.memory),
      ssh.execCommand(cmds.cpuLoad),
      ssh.execCommand(cmds.uptime),
    ]);

  const boardName = (boardNameRes.stdout || boardNameRes.stderr || "").trim();
  const version = (versionRes.stdout || versionRes.stderr || "").trim();

  const [totalStr = "0", usedStr = "0"] = (
    memoryRes.stdout ||
    memoryRes.stderr ||
    ""
  )
    .trim()
    .split(/\s+/);
  const totalMB = parseInt(totalStr, 10) || 0;
  const usedMB = parseInt(usedStr, 10) || 0;

  const [l1 = "0", l5 = "0", l15 = "0"] = (
    cpuLoadRes.stdout ||
    cpuLoadRes.stderr ||
    ""
  )
    .trim()
    .split(",");
  const cpuLoad = {
    load1: parseFloat(l1) || 0,
    load5: parseFloat(l5) || 0,
    load15: parseFloat(l15) || 0,
  };

  const uptimeRaw = (uptimeRes.stdout || uptimeRes.stderr || "").trim();
  let uptime = "";
  const secs = parseInt(uptimeRaw, 10);
  if (!isNaN(secs)) {
    uptime = formatUptimeHMFromSeconds(secs);
  } else {
    const m = uptimeRaw.match(
      /(?:(\d+)\s*d)?\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?/i
    );
    if (m) {
      const d = parseInt(m[1] || "0", 10);
      const h = parseInt(m[2] || "0", 10);
      const mm = parseInt(m[3] || "0", 10);
      const totalHours = d * 24 + h;
      uptime = `${totalHours}h ${mm}m`;
    } else {
      uptime = uptimeRaw;
    }
  }

  return {
    boardName,
    version,
    memory: { totalMB, usedMB },
    cpuLoad,
    uptime,
  };
}

export const getSecretsStatus = async (ssh: NodeSSH) => {
  // Jalankan perintah dengan fallback tanpa "without-paging"
  const execWithFallback = async (baseCmd: string) => {
    let res = await ssh.execCommand(`${baseCmd} without-paging`);
    if (res.stderr || !res.stdout) {
      res = await ssh.execCommand(baseCmd);
    }
    return res;
  };

  const secretRes = await execWithFallback("/ppp secret print detail");
  const activeRes = await execWithFallback("/ppp active print detail");

  const rawSecretOut = (secretRes.stdout || secretRes.stderr || "").trim();
  const rawActiveOut = (activeRes.stdout || activeRes.stderr || "").trim();

  // Parser V2 (baru): dukung key=value (quoted / non-quoted) + colon style
  const parseBlocks = (out: string) =>
    out
      .split(/\r?\n\r?\n+/)
      .map((b) => b.trim())
      .filter(Boolean);

  const parseV2 = (out: string) => {
    if (!out) return [];
    return parseBlocks(out).map((block) => {
      const obj: Record<string, string> = {};
      const lines = block
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      // Simpan index jika ada "0   name=..." di awal
      const firstLine = lines[0] || "";
      const idxMatch = firstLine.match(/^\s*(\d+)\s+(?=[A-Za-z0-9_.\-*]+=)/);
      if (idxMatch) obj[".index"] = idxMatch[1];

      // Gabungkan untuk ekstraksi key=value
      const joined = lines.join(" ");

      // key=value (quoted / non-quoted)
      const kvRegex = /([A-Za-z0-9*_.\-\/]+)=(?:"([^"]*)"|([^"\s]+))/g;
      let m: RegExpExecArray | null;
      while ((m = kvRegex.exec(joined)) !== null) {
        const key = m[1];
        const val = m[2] ?? m[3] ?? "";
        obj[key] = val;
      }

      // Field: value (format lama)
      for (const line of lines) {
        const cm = line.match(/^([A-Za-z0-9_.\-@]+):\s*(.+)$/);
        if (cm) obj[cm[1]] = cm[2];
      }

      return obj;
    });
  };

  // Parser V1 (lama) hanya "Field: value"
  const parseV1 = (out: string) => {
    if (!out) return [];
    return parseBlocks(out).map((block) => {
      const obj: Record<string, string> = {};
      for (const line of block.split(/\r?\n/)) {
        const m = line.match(/^([^:]+):\s*(.*)$/);
        if (m) obj[m[1].trim()] = m[2].trim();
      }
      return obj;
    });
  };

  // Coba parser baru
  let secrets = parseV2(rawSecretOut);
  // Fallback ke lama bila tidak efektif (tidak ada name/user)
  const hasIdentity = secrets.some(
    (o) =>
      Object.keys(o).some((k) => k.toLowerCase() === "name") ||
      Object.keys(o).some((k) => k.toLowerCase() === "user")
  );
  if (!secrets.length || !hasIdentity) {
    secrets = parseV1(rawSecretOut);
  }

  // Active entries parse (pakai V2 dulu, fallback jika kosong)
  let actives = parseV2(rawActiveOut);
  if (!actives.length) actives = parseV1(rawActiveOut);

  const findField = (obj: Record<string, string>, name: string) => {
    const key = Object.keys(obj).find(
      (k) => k.toLowerCase() === name.toLowerCase()
    );
    return key ? obj[key] : undefined;
  };

  // Map active (name/user -> object)
  const activeMap = new Map<string, Record<string, string>>();
  for (const a of actives) {
    const n = findField(a, "name") || findField(a, "user") || "";
    if (n) activeMap.set(n, a);
  }

  // Ambil last active dari beberapa kemungkinan field
  const pickLastActive = (a?: Record<string, string> | null) => {
    if (!a) return null;
    const candidates = [
      a["uptime"],
      a["time"],
      a["login-time"],
      a["last-seen"],
      a["last-login"],
      a["connected"],
      a["session-time"],
    ].filter(Boolean) as string[];
    return candidates.length ? candidates[0] : null;
  };

  // Detailed list
  const detailed = secrets.map((s) => {
    const username =
      findField(s, "name") ||
      findField(s, "user") ||
      findField(s, "username") ||
      "";
    const password =
      findField(s, "password") ||
      findField(s, "pass") ||
      findField(s, "secret") ||
      "";
    const profile = findField(s, "profile") || "";
    const service = findField(s, "service") || "";
    const lastLoggedOut =
      findField(s, "last-logged-out") || findField(s, "last-logout") || "";
    const activeEntry = username ? activeMap.get(username) : undefined;
    const lastActive = pickLastActive(activeEntry);

    return {
      id: findField(s, ".id"),
      username,
      password,
      profile,
      service,
      lastLoggedOut: lastLoggedOut || null,
      lastActive,
      isActive: !!activeEntry,
      raw: s,
    };
  });

  const active = detailed.filter((d) => d.isActive).map((d) => d.raw);
  const inactive = detailed.filter((d) => !d.isActive).map((d) => d.raw);

  // Jangan dispose di sini jika masih dipakai di luar; saat ini getInterface memanggil dispose setelahnya.
  // (Biarkan seperti sebelumnya bila memang ingin dispose di sini, uncomment baris di bawah)
  // ssh.dispose();

  return {
    // all: secrets,
    active,
    inactive,
    // list: detailed,
    // raw: { secretRes, activeRes },
  };
};
