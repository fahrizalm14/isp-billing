import { RouterOSAPI } from "node-routeros";
import type { MikroTikConfig } from "./type";

const DEFAULT_ROUTEROS_PORT = 8728;

const resolvePort = (port?: number) => {
  if (!port || port === 22) {
    return DEFAULT_ROUTEROS_PORT;
  }
  return port;
};

export type RouterOSConnection = RouterOSAPI;

export const createRouterOSConnection = async (
  config: MikroTikConfig,
  options: { timeout?: number } = {}
) => {
  const client = new RouterOSAPI({
    host: config.host,
    user: config.username,
    password: config.password,
    port: resolvePort(config.port),
    timeout: options.timeout ?? 10_000,
  });

  const connection = await client.connect();

  const close = async () => {
    try {
      await connection.close();
    } catch {
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
  try {
    const data = await connection.write(command, params);
    const records = Array.isArray(data) ? data : [];
    const stdout = records.map(serializeRecord).join("\n");
    return { code: 0, stdout, stderr: "", data: records };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error ?? "Unknown error");
    return { code: 1, stdout: "", stderr: message, data: [] };
  }
};
