import { generateInvoiceForSubscription } from "./payment";
import { prisma } from "./prisma";
import { deactivateSubscription } from "./subscription";

// Helper buat konversi jam Jakarta ke UTC Date
function jakartaToUTC(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  ms: number
) {
  // Buat Date UTC langsung
  return new Date(Date.UTC(year, month, day, hour - 7, minute, second, ms));
}

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

const getJakartaDayStartUTC = (date = new Date()) => {
  const jakartaDate = new Date(date.getTime() + JAKARTA_OFFSET_MS);
  return jakartaToUTC(
    jakartaDate.getFullYear(),
    jakartaDate.getMonth(),
    jakartaDate.getDate(),
    0,
    0,
    0,
    0
  );
};

const isSameJakartaDay = (a: Date | null | undefined, reference: Date) => {
  if (!a) return false;
  return getJakartaDayStartUTC(a).getTime() === reference.getTime();
};

export const generateInvoice = async () => {
  // Ambil batas pagi hari Jakarta untuk memastikan satu hari dihitung konsisten.
  const runDate = getJakartaDayStartUTC();

  const DAY_MS = 24 * 60 * 60 * 1000;
  const targetOffsets = [0, 1, 5];
  const targetStarts = targetOffsets.map(
    (offset) => new Date(runDate.getTime() + offset * DAY_MS)
  );
  // earliestStart = H-5, latestEnd = akhir hari H
  const earliestStart = targetStarts[0];
  const latestEnd = new Date(
    targetStarts[targetStarts.length - 1].getTime() + DAY_MS - 1
  );
  // targetDayMap memudahkan pengecekan apakah expiredAt jatuh ke salah satu dari H-5/H-1/H.
  const targetDayMap = new Set(targetStarts.map((date) => date.getTime()));

  // Tangkap langganan yang expired-nya berada di H-5, H-1, atau H.
  const subscription = await prisma.subscription.findMany({
    where: {
      active: true,
      expiredAt: {
        gte: earliestStart,
        lte: latestEnd,
      },
    },
    include: {
      package: {
        select: {
          price: true,
          name: true,
        },
      },
      userProfile: {
        select: {
          name: true,
          phone: true,
        },
      },
    },
  });

  let processed = 0; // untuk ngitung berapa invoice yang dibuat per run

  // Loop tiap langganan sebelum invoicing dan skip kalau sudah diproses hari ini.
  for (const sub of subscription) {
    if (isSameJakartaDay(sub.lastInvoiceCreated, runDate)) {
      // Lewatkan kalau invoicing sudah dilakukan pada hari Jakarta yang sama.
      console.info(
        `generateInvoice already created today for subscription ${sub.id}, skipping by lastInvoiceCreated.`
      );
      continue;
    }

    if (!sub.expiredAt) {
      continue;
    }

    const expiredJakartaStart = getJakartaDayStartUTC(sub.expiredAt);
    if (!targetDayMap.has(expiredJakartaStart.getTime())) {
      continue;
    }

    // Panggil helper untuk membentuk invoice dengan detail paket.
    await generateInvoiceForSubscription(
      sub.id,
      sub.package.price,
      sub.expiredAt || new Date(),
      {
        email: `${sub.userProfile.phone}@mail.com` || "",
        phone: sub.userProfile.phone || "",
        name: sub.userProfile.name || "",
      },
      [
        {
          id: sub.packageId,
          name: sub.package.name,
          price: sub.package.price,
          quantity: 1,
        },
      ]
    );

    // Update penanda agar tidak diproses ulang hari yang sama.
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { lastInvoiceCreated: new Date() },
    });

    processed++;
  }

  return processed;
};

export const auditSubscription = async () => {
  // cek apakah ada expired yang melebihi dari hari ini
  const today = new Date();
  const todayUTC = jakartaToUTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0,
    0,
    0,
    0
  );

  const subscriptions = await prisma.subscription.findMany({
    where: {
      expiredAt: {
        lte: todayUTC,
      },
      isAudited: false,
    },
  });

  for (const sub of subscriptions) {
    await deactivateSubscription(sub.id, true);
  }
};
