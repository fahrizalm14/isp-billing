/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "./prisma";

async function sendMessage(phone: string, message: string) {
  const config = await prisma.websiteInfo.findFirst();
  if (!config?.apiKey || !config?.apiUrl) {
    throw new Error("WebsiteInfo belum ada API Key/URL");
  }

  const apiKey = config.apiKey;
  const baseUrl = config.apiUrl;

  // Pastikan nomor telepon dalam format yang benar (62xxx)
  const formattedPhone = phone.startsWith("62")
    ? phone
    : `62${phone.replace(/^0/, "")}`;

  const url = `${baseUrl}/api/v1/whatsapp/message/${apiKey}/send`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: formattedPhone,
      text: message,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `WhatsApp API request failed: ${response.status} ${
        response.statusText
      } - ${JSON.stringify(errorData)}`
    );
  }

  const result = await response.json();
  return result;
}

// helper delay
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Worker untuk memproses pesan QUEUED / FAILED
export async function processMessages() {
  const messages = await prisma.message.findMany({
    where: { status: { in: ["QUEUED"] } },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  for (const msg of messages) {
    try {
      // cek jumlah pesan terkirim ke nomor ini dalam 1 jam terakhir
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const sentCount = await prisma.message.count({
        where: {
          toNumber: msg.toNumber,
          status: "SENT",
          createdAt: { gte: oneHourAgo },
        },
      });

      if (sentCount >= 5) {
        // kalau sudah lewat limit → tandai FAILED
        await prisma.message.update({
          where: { id: msg.id },
          data: { status: "FAILED", error: "Rate limit exceeded" },
        });

        console.warn(`⚠️ Rate limit exceeded untuk ${msg.toNumber}`);
        continue;
      }

      // kirim pesan via wablas
      await sendMessage(msg.toNumber, msg.content);

      await prisma.message.update({
        where: { id: msg.id },
        data: { status: "SENT", error: null },
      });

      console.log(`✅ Pesan SENT ke ${msg.toNumber}`);

      // delay antar pesan
      await sleep(2000);
    } catch (err: any) {
      await prisma.message.update({
        where: { id: msg.id },
        data: { status: "FAILED", error: err.message },
      });

      console.error(`❌ Gagal kirim ke ${msg.toNumber}: ${err.message}`);
    }
  }
}
