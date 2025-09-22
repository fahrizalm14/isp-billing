import { prisma } from "@/lib/prisma";
import { fillTemplate } from "@/types/helper";

/**
 * Jalankan trigger otomatis berdasarkan key
 * @param key nama key trigger (misalnya "INVOICE_CREATED" atau "PAYMENT_SUCCESS")
 * @param subscriptionId wajib, untuk mengambil detail subscription & payment
 */
export async function runTriggers(
  key:
    | "REGISTER_SUCCESS"
    | "PAYMENT_SUCCESS"
    | "DEACTIVATE_SUBSCRIPTION"
    | "ACTIVATE_SUBSCRIPTION"
    | "INVOICE_CREATED",
  subscriptionId: string
) {
  const triggers = await prisma.trigger.findMany({
    where: { key, isActive: true },
    include: { template: true },
  });

  if (!triggers.length) {
    console.log(`[Trigger] Tidak ada trigger dengan key ${key}`);
    return;
  }

  // subscriptionId wajib
  const subs = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      userProfile: true,
      package: true,
      usersPPPOE: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!subs) {
    console.error(`[Trigger] Subscription ${subscriptionId} tidak ditemukan`);
    return;
  }

  const ppp = subs.usersPPPOE?.length ? subs.usersPPPOE[0] : null;
  const lastPayment = subs.payments?.length ? subs.payments[0] : null;

  // siapkan context variabel template
  const context = {
    nama: subs.userProfile?.name ?? "",
    paket: subs.package?.name ?? "",
    noLangganan: subs.number,
    userPPP: ppp?.username ?? "",
    passwordPPP: ppp?.password ?? "",
    amount: lastPayment ? lastPayment.amount.toString() : "",
    periode: subs.dueDate ?? "",
    paymentLink: lastPayment?.paymentLink ?? "",
  };

  const website = await prisma.websiteInfo.findFirst();

  for (const trg of triggers) {
    let toNumber: string | null = null;

    switch (trg.scope) {
      case "ADMIN":
        toNumber = website?.adminPhone ?? null;
        break;
      case "SUPPORT":
        toNumber = website?.supportPhone ?? null;
        break;
      case "USER":
        toNumber = subs.userProfile?.phone ?? null;
        break;
    }

    if (toNumber) {
      const content = fillTemplate(trg.template.content, context);

      await prisma.message.create({
        data: {
          triggerKey: trg.key,
          toNumber,
          content,
          status: "QUEUED",
        },
      });
    }
  }
}
