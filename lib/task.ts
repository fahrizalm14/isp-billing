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

export const generateInvoice = async () => {
  // Ambil waktu Jakarta hari ini
  const now = new Date();

  const fiveDaysLater = new Date(now);
  fiveDaysLater.setDate(fiveDaysLater.getDate() + 4);

  const start = jakartaToUTC(
    fiveDaysLater.getFullYear(),
    fiveDaysLater.getMonth(),
    fiveDaysLater.getDate(),
    0,
    0,
    0,
    0
  );

  const end = jakartaToUTC(
    fiveDaysLater.getFullYear(),
    fiveDaysLater.getMonth(),
    fiveDaysLater.getDate(),
    23,
    59,
    59,
    999
  );

  const subscription = await prisma.subscription.findMany({
    where: {
      active: true,
      expiredAt: {
        gte: start,
        lte: end,
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

  for (const sub of subscription) {
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
  }
  return subscription.length;
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
