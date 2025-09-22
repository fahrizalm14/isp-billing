/* ===== Helpers ===== */
type TemplateContext = {
  nama?: string;
  paket?: string;
  noLangganan?: string;
  userPPP?: string;
  passwordPPP?: string;
  amount?: string; // formatted string
  periode?: string;
  paymentLink?: string;
};

export function fillTemplate(
  template: string,
  context: TemplateContext
): string {
  let result = template.replace(/{{(.*?)}}/g, (_, key) => {
    const value = (context as Record<string, string>)[key.trim()];
    return value ?? "";
  });

  // Hapus baris yang cuma spasi/tab
  result = result.replace(/^[ \t]+$/gm, "");

  // Ganti multiple newline jadi 2 maksimal (biar masih ada jarak paragraf)
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim();
}

export const dummyContext = {
  nama: "Budi",
  paket: "Premium 20Mbps",
  noLangganan: "25000123",
  userPPP: "pppoe123",
  passwordPPP: "pppoe123",
  amount: "Rp 10.0000",
  periode: "Agustus 2025",
  paymentLink: "https://midtrans/xxxxx/xxxx",
};

export interface IMessageTemplate {
  id: string;
  nama: string;
  content: string; // with {{vars}}
}

export const availableVars = [
  "{{nama}}",
  "{{paket}}",
  "{{noLangganan}}",
  "{{userPPP}}",
  "{{passwordPPP}}",
  "{{amount}}",
  "{{periode}}",
  "{{paymentLink}}",
];

export interface IMessage {
  id: string;
  createdAt: string;
  kategori: string;
  user: string;
  content: string;
  status: "QUEUED" | "SENT" | "FAILED";
}
