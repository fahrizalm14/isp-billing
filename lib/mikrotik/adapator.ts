export function toProfileKey(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "_");
}

export function toProfileName(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getGatewayFromPool(poolRange: string): string {
  const partsRaw = (poolRange || "").split("-")[0] || "";
  const startIP = partsRaw.trim();
  const parts = startIP.split(".").map((p) => Number(p));

  // fallback jika format IP tidak lengkap -> kembalikan string input
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
    // coba extract terakhir berupa angka, jika gagal, kembalikan startIP apa adanya
    return startIP;
  }

  // Kurangi 1 di oktet terakhir untuk dapat gateway
  parts[3] = parts[3] - 1;

  return parts.join(".");
}
export function formatPhoneNumberToIndonesia(
  phoneNumber: string
): string | null {
  // 1. Bersihkan input: Hapus semua karakter non-digit
  const cleaned = phoneNumber.replace(/\D/g, "");

  let normalizedNumber: string;

  // 2. Normalisasi ke awalan '62'
  if (cleaned.startsWith("0")) {
    // Contoh: '0812...' -> '62812...'
    normalizedNumber = "62" + cleaned.substring(1);
  } else if (cleaned.startsWith("62")) {
    // Contoh: '62812...' -> '62812...' (sudah standar)
    normalizedNumber = cleaned;
  } else if (cleaned.startsWith("8")) {
    // Contoh: '812...' -> '62812...'
    normalizedNumber = "62" + cleaned;
  } else {
    // Jika tidak dimulai dengan '0', '62', atau '8', tidak dikenali sebagai format Indonesia.
    return null;
  }

  // 3. Validasi: Periksa apakah nomor yang dinormalisasi adalah nomor seluler Indonesia yang valid
  // Kriteria:
  // a. Harus dimulai dengan '628' (kode negara + awalan seluler)
  // b. Total panjang (termasuk '62') harus antara 12 dan 15 digit.
  //    (Ini sesuai dengan 10-13 digit setelah awalan '62', yang umum untuk nomor seluler Indonesia)
  const MIN_TOTAL_LENGTH = 10; // Contoh: 628123456789 (12 digit)
  const MAX_TOTAL_LENGTH = 15; // Contoh: 628123456789012 (15 digit)

  if (
    normalizedNumber.startsWith("628") &&
    normalizedNumber.length >= MIN_TOTAL_LENGTH &&
    normalizedNumber.length <= MAX_TOTAL_LENGTH
  ) {
    return normalizedNumber; // Nomor valid dan diformat
  } else {
    return null; // Gagal validasi
  }
}
