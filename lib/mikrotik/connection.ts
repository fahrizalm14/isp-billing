export const runtime = "nodejs";

import {
  RouterOSConnection,
  createRouterOSConnection,
  executeCommand,
} from "./client";
import { MikroTikConfig } from "./type";

const toStringValue = (value: unknown) =>
  value === null || value === undefined ? "" : String(value);

const parseMemToMB = (raw: unknown) => {
  const value = toStringValue(raw).trim();
  if (!value) return 0;

  const match = value.match(/([\d.]+)\s*(\w+)/i);
  if (!match) return parseFloat(value) || 0;

  let amount = parseFloat(match[1]);
  const unit = (match[2] || "").toUpperCase();

  switch (unit) {
    case "KIB":
    case "KB":
      amount = amount / 1024;
      break;
    case "MIB":
    case "MB":
      break;
    case "GIB":
    case "GB":
      amount = amount * 1024;
      break;
    default:
      amount = amount / (1024 * 1024);
  }

  return Math.round(amount);
};

const formatUptimeHMFromSeconds = (seconds: number) => {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}Jam ${minutes}Menit`;
};

const parseRouterOSUptimeToHM = (uptime: string | undefined) => {
  if (!uptime) return "";

  const match = uptime.match(
    /(?:(\d+)\s*w)?\s*(?:(\d+)\s*d)?\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?/i
  );

  if (!match) return uptime;

  const weeks = parseInt(match[1] || "0", 10);
  const days = parseInt(match[2] || "0", 10);
  const hours = parseInt(match[3] || "0", 10);
  const minutes = parseInt(match[4] || "0", 10);
  const seconds = parseInt(match[5] || "0", 10);

  const totalSeconds =
    (((weeks * 7 + days) * 24 + hours) * 60 + minutes) * 60 + seconds;

  return formatUptimeHMFromSeconds(totalSeconds);
};

const extractNumber = (raw: unknown) => {
  const value = toStringValue(raw);
  const match = value.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
};

export const tesConnection = async ({
  host,
  username,
  password,
  port,
}: MikroTikConfig) => {
  const { connection, close } = await createRouterOSConnection(
    { host, username, password, port },
    { timeout: 5_000 }
  );

  try {
    await connection.write("/system/identity/print");
  } finally {
    await close();
  }
};

export const getPools = async ({
  host,
  username,
  password,
  port,
}: MikroTikConfig) => {
  const { connection, close } = await createRouterOSConnection({
    host,
    username,
    password,
    port,
  });

  try {
    const poolResult = await executeCommand(connection, "/ip/pool/print");
    const ipResult = await executeCommand(connection, "/ip/address/print");
    return { poolResult, ipResult };
  } finally {
    await close();
  }
};

export const getBandwidth = async ({
  host,
  username,
  password,
  port,
  params = "",
}: MikroTikConfig) => {
  const { connection, close } = await createRouterOSConnection({
    host,
    username,
    password,
    port,
  });

  try {
    const result = await executeCommand(connection, "/interface/monitor-traffic", [
      `=interface=${params}`,
      "=once=yes",
    ]);

    if (result.code !== 0) {
      return result;
    }

    const formattedStdout = result.data
      .map((row) =>
        Object.entries(row)
          .filter(([key]) => key !== "type")
          .map(([key, value]) => `${key}: ${toStringValue(value)}`)
          .join("\n")
      )
      .join("\n");

    return { ...result, stdout: formattedStdout };
  } finally {
    await close();
  }
};

export const getInterface = async ({
  host,
  username,
  password,
  port,
}: MikroTikConfig) => {
  const { connection, close } = await createRouterOSConnection({
    host,
    username,
    password,
    port,
  });

  try {
    const result = await executeCommand(connection, "/interface/print");
    const systemInfo = await getSystemInfo(connection);
    const secrets = await getSecretsStatus(connection);

    return { result, systemInfo, secrets };
  } finally {
    await close();
  }
};

export type SystemInfo = {
  boardName: string;
  version: string;
  memory: {
    totalMB: number;
    usedMB: number;
  };
  cpuLoad: {
    load1: number;
    load5: number;
    load15: number;
  };
  uptime: string;
};

export async function getSystemInfo(
  connection: RouterOSConnection
): Promise<SystemInfo> {
  const resourceRes = await executeCommand(
    connection,
    "/system/resource/print"
  );
  const identityRes = await executeCommand(
    connection,
    "/system/identity/print"
  );

  const resource = resourceRes.data[0] ?? {};
  const identity = identityRes.data[0] ?? {};

  const boardName =
    toStringValue(resource["board-name"]).trim() ||
    toStringValue(identity.name).trim();
  const version = toStringValue(resource.version).trim();
  const uptime = parseRouterOSUptimeToHM(toStringValue(resource.uptime));

  const totalMB = parseMemToMB(resource["total-memory"]);
  const freeMB = parseMemToMB(resource["free-memory"]);
  const usedMB = Math.max(0, totalMB - freeMB);

  const cpuPercent = Math.max(
    0,
    Math.min(
      100,
      extractNumber(resource["cpu-load"]) || extractNumber(resource["cpu"])
    )
  );

  return {
    boardName,
    version,
    memory: { totalMB, usedMB },
    cpuLoad: { load1: cpuPercent, load5: 0, load15: 0 },
    uptime,
  };
}

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

const findField = (
  obj: Record<string, string>,
  name: string
): string | undefined => {
  const key = Object.keys(obj).find(
    (candidate) => candidate.toLowerCase() === name.toLowerCase()
  );
  return key ? obj[key] : undefined;
};

const pickLastActive = (entry?: Record<string, string> | null) => {
  if (!entry) return null;
  const candidates = [
    entry["uptime"],
    entry["time"],
    entry["login-time"],
    entry["last-seen"],
    entry["last-login"],
    entry["connected"],
    entry["session-time"],
  ].filter(Boolean) as string[];
  return candidates.length ? candidates[0] : null;
};

export const getSecretsStatus = async (connection: RouterOSConnection) => {
  const secretRes = await executeCommand(connection, "/ppp/secret/print");
  const activeRes = await executeCommand(connection, "/ppp/active/print");

  const secrets = secretRes.data.map(normalizeRecord);
  const actives = activeRes.data.map(normalizeRecord);

  const activeMap = new Map<string, Record<string, string>>();
  for (const active of actives) {
    const identity =
      findField(active, "name") ||
      findField(active, "user") ||
      findField(active, "username") ||
      "";
    if (identity) {
      activeMap.set(identity, active);
    }
  }

  const detailed = secrets.map((secret) => {
    const username =
      findField(secret, "name") ||
      findField(secret, "user") ||
      findField(secret, "username") ||
      "";
    const password =
      findField(secret, "password") ||
      findField(secret, "pass") ||
      findField(secret, "secret") ||
      "";
    const profile = findField(secret, "profile") || "";
    const service = findField(secret, "service") || "";
    const lastLoggedOut =
      findField(secret, "last-logged-out") ||
      findField(secret, "last-logout") ||
      "";
    const activeEntry = username ? activeMap.get(username) : undefined;
    const lastActive = pickLastActive(activeEntry);

    return {
      id: findField(secret, ".id"),
      username,
      password,
      profile,
      service,
      lastLoggedOut: lastLoggedOut || null,
      lastActive,
      isActive: !!activeEntry,
      raw: secret,
    };
  });

  const active = detailed.filter((entry) => entry.isActive).map((entry) => entry.raw);
  const inactive = detailed
    .filter((entry) => !entry.isActive)
    .map((entry) => entry.raw);

  return { active, inactive };
};
