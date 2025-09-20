export const runtime = "nodejs";

import crypto from "crypto";

const algorithm = "aes-256-cbc";
const key = crypto.scryptSync(process.env.ENCRYPT_SECRET_KEY!, "salt", 32);
const iv = crypto.randomBytes(16);

export function encrypt(text: string): string {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(encrypted: string): string {
  const [ivHex, encryptedHex] = encrypted.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encryptedText = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([
    decipher.update(encryptedText),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
