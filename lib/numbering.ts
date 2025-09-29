import { prisma } from "@/lib/prisma";

export async function generateSubscriptionNumber() {
  const today = new Date();
  const year = String(today.getFullYear()).slice(-2); // 2 digit tahun
  const month = String(today.getMonth() + 1).padStart(2, "0"); // bulan (01-12)
  const periodStr = `${year}${month}`; // jadi "YYMM"

  // awal dan akhir bulan
  const startOfMonth = new Date(
    today.getFullYear(),
    today.getMonth(),
    1,
    0,
    0,
    0,
    0
  );
  const endOfMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  // cari nomor terakhir bulan ini
  const lastSubscription = await prisma.subscription.findFirst({
    where: {
      createdAt: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // nomor urut
  let sequence = 1;
  if (lastSubscription?.number) {
    const lastSeq = parseInt(lastSubscription.number.slice(-4)) || 0; // ambil 4 digit terakhir
    sequence = lastSeq + 1;
  }

  // 4 digit urut
  const paddedSeq = String(sequence).padStart(4, "0");

  return `${periodStr}${paddedSeq}`;
}

/**
 * Generate nomor unik
 * Format: PAY-YYYYMMDD-XXXX
 */
export async function generatePaymentNumber() {
  // ambil tanggal hari ini (format YYYYMMDD)
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

  // cari terakhir di hari ini
  const lastPayment = await prisma.payment.findFirst({
    where: {
      createdAt: {
        gte: new Date(today.setHours(0, 0, 0, 0)), // awal hari
        lt: new Date(today.setHours(23, 59, 59, 999)), // akhir hari
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // generate nomor urut
  let sequence = 1;
  if (lastPayment?.number) {
    const lastSeq = parseInt(lastPayment.number.split("-").pop() || "0");
    sequence = lastSeq + 1;
  }

  // pad urut ke 4 digit
  const paddedSeq = String(sequence).padStart(4, "0");

  // gabungkan jadi nomor
  return `PAY-${dateStr}-${paddedSeq}`;
}

/**
 * Generate random prefix
 * @param {string} prefix - Awalan username (contoh: "user")
 * @param {number} length - Panjang random string setelah prefix
 * @returns {string} Username yang sudah digenerate
 */
export function generateRandomPrefix(
  prefix: string = "user",
  length: number = 4
): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let suffix = "";
  for (let i = 0; i < length; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${suffix}@${prefix}`;
}
