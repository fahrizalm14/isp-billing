import { prisma } from "@/lib/prisma";
import { fillTemplate } from "@/types/helper";
import { calculatePaymentTotals } from "./paymentTotals";

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
  const totals = lastPayment
    ? calculatePaymentTotals({
        amount: lastPayment.amount,
        discount: lastPayment.discount ?? 0,
        taxPercent: lastPayment.tax ?? 0,
      })
    : null;

  const context = {
    nama: subs.userProfile?.name ?? "",
    paket: subs.package?.name ?? "",
    noLangganan: subs.number,
    userPPP: ppp?.username ?? "",
    passwordPPP: ppp?.password ?? "",
    amount: totals ? totals.total.toString() : "",
    amountFormatted: totals ? totals.total.toLocaleString("id-ID") : "",
    discount: totals ? totals.discount.toString() : "0",
    discountFormatted: totals
      ? totals.discount.toLocaleString("id-ID")
      : "0",
    taxPercent: totals ? totals.taxPercent.toString() : "0",
    taxValue: totals ? totals.taxValue.toString() : "0",
    taxValueFormatted: totals
      ? totals.taxValue.toLocaleString("id-ID")
      : "0",
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
