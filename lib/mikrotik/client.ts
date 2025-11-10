import { Routeros } from "routeros-node";
import type { MikroTikConfig } from "./type";

const DEFAULT_ROUTEROS_PORT = 8728;

const resolvePort = (port?: number) => {
  if (!port || port === 22) {
    return DEFAULT_ROUTEROS_PORT;
  }
  return port;
};

export type RouterOSConnection = Omit<Routeros, "connect">;

export const createRouterOSConnection = async (
  config: MikroTikConfig,
  options: { timeout?: number } = {}
) => {
  const timeout = options.timeout ?? 15000; // Increase default timeout to 15s

  console.log("🔌 [MIKROTIK_CLIENT] Creating connection:", {
    host: config.host,
    port: resolvePort(config.port),
    timeout,
  });

  const client = new Routeros({
    host: config.host,
    user: config.username,
    password: config.password,
    port: resolvePort(config.port),
    timeout,
  });

  const startConnect = Date.now();
  const connection = await client.connect();
  console.log(
    `✅ [MIKROTIK_CLIENT] Connection established (${
      Date.now() - startConnect
    }ms)`
  );

  const close = async () => {
    try {
      console.log("🔌 [MIKROTIK_CLIENT] Destroying connection...");
      connection.destroy();
      console.log("✅ [MIKROTIK_CLIENT] Connection destroyed");
    } catch (error) {
      console.error("⚠️ [MIKROTIK_CLIENT] Error closing connection:", error);
      // ignore close error to mirror old ssh.dispose() behaviour
    }
  };

  return { connection, close };
};

const quoteIfNeeded = (value: string) => {
  if (!value.length) return '""';
  const needsQuote = /\s/.test(value) || /["']/.test(value);
  if (!needsQuote) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
};

const serializeRecord = (record: Record<string, unknown>) => {
  const entries = Object.entries(record).filter(
    ([key, val]) => key !== "type" && key !== "ret" && val !== undefined
  );

  return entries
    .map(([key, rawValue]) => {
      const value =
        rawValue === null || rawValue === undefined
          ? ""
          : typeof rawValue === "string"
          ? rawValue
          : String(rawValue);
      return `${key}=${quoteIfNeeded(value)}`;
    })
    .join(" ");
};

export type RouterOSCommandResult = {
  code: number;
  stdout: string;
  stderr: string;
  data: Record<string, unknown>[];
};

export const executeCommand = async (
  connection: RouterOSConnection,
  command: string,
  params: string[] = []
): Promise<RouterOSCommandResult> => {
  const startTime = Date.now();
  console.log("⚡ [EXECUTE_CMD] Starting command:", {
    command,
    params: params.length > 0 ? params : "(no params)",
  });

  try {
    // routeros-node menggunakan write() dengan array queries
    // Format: [command, ...params]
    const queries = [command, ...params];

    const data = await connection.write(queries);
    const records = Array.isArray(data) ? data : [];
    const stdout = records.map(serializeRecord).join("\n");

    const duration = Date.now() - startTime;
    console.log(`✅ [EXECUTE_CMD] Command completed (${duration}ms):`, {
      command,
      recordCount: records.length,
    });

    return { code: 0, stdout, stderr: "", data: records };
  } catch (error) {
    const duration = Date.now() - startTime;
    const message =
      error instanceof Error ? error.message : String(error ?? "Unknown error");

    console.error(`❌ [EXECUTE_CMD] Command failed (${duration}ms):`, {
      command,
      error: message,
    });

    return { code: 1, stdout: "", stderr: message, data: [] };
  }
};
