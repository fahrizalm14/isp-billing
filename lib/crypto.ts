export const runtime = "nodejs";

import crypto from "crypto";

const algorithm = "aes-256-cbc";

function resolveKey() {
  const secret = process.env.ENCRYPT_SECRET_KEY;

  if (!secret) {
    throw new Error("Missing ENCRYPT_SECRET_KEY environment variable.");
  }

  return crypto.scryptSync(secret, "salt", 32);
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = resolveKey();
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(encrypted: string): string {
  const [ivHex, encryptedHex] = encrypted.split(":");

  if (!ivHex || !encryptedHex) {
    throw new Error("Invalid encrypted payload format.");
  }

  const iv = Buffer.from(ivHex, "hex");
  const key = resolveKey();
  const encryptedText = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
