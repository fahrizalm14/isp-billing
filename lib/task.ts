import { decrypt } from "./crypto";
import { generateInvoiceForSubscription } from "./payment";
import { prisma } from "./prisma";
import { runTriggers } from "./runTriggers";
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

const normalizeRouterUsername = (value: string | undefined) =>
  (value || "").toLowerCase().trim();

const extractRecordUsername = (record: Record<string, string>) =>
  normalizeRouterUsername(
    record["name"] || record["user"] || record["username"] || ""
  );

const buildSecretUsernameSet = (records?: Record<string, string>[]) => {
  const set = new Set<string>();
  if (!records?.length) {
    return set;
  }

  for (const record of records) {
    const normalized = extractRecordUsername(record);
    if (normalized) {
      set.add(normalized);
    }
  }

  return set;
};

const safeDecryptPassword = (encrypted: string) => {
  try {
    return decrypt(encrypted);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_err: unknown) {
    console.warn("⚠️ Gagal decrypt router password, menggunakan nilai mentah");
    return encrypted;
  }
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

export const checkInactiveConnections = async () => {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      active: true,
    },
    include: {
      package: {
        include: {
          router: true,
        },
      },
      userProfile: true,
      usersPPPOE: true,
    },
  });

  type SubscriptionWithRouter = (typeof subscriptions)[number];
  type RouterGroup = {
    router: NonNullable<SubscriptionWithRouter["package"]["router"]>;
    items: SubscriptionWithRouter[];
  };

  const routerGroups = new Map<string, RouterGroup>();

  for (const sub of subscriptions) {
    const router = sub.package.router;
    if (!router || !router.ipAddress) continue;

    const group = routerGroups.get(router.id);
    if (group) {
      group.items.push(sub);
      continue;
    }
    routerGroups.set(router.id, {
      router,
      items: [sub],
    });
  }

  let processed = 0;

  const routerConnectionStatus = new Map<
    string,
    { activeSet: Set<string>; inactiveSet: Set<string> }
  >();
  const { getInterface } = await import("@/lib/mikrotik/connection");

  for (const { router } of routerGroups.values()) {
    if (!router.apiUsername || !router.apiPassword) {
      console.info(
        `↪️ Router ${router.ipAddress} melewatkan karena kredensial tidak lengkap`
      );
      continue;
    }

    try {
      const interfaceData = await getInterface({
        host: router.ipAddress,
        username: router.apiUsername,
        password: safeDecryptPassword(router.apiPassword),
        port: Number(router.port) || 65534,
      });
      routerConnectionStatus.set(router.id, {
        activeSet: buildSecretUsernameSet(interfaceData.secrets?.active),
        inactiveSet: buildSecretUsernameSet(interfaceData.secrets?.inactive),
      });
    } catch (error) {
      console.error(
        "❌ Gagal mengambil status PPPoE untuk router",
        router.ipAddress,
        error
      );
    }
  }

  for (const { router, items } of routerGroups.values()) {
    const status = routerConnectionStatus.get(router.id);
    if (!status) {
      continue;
    }

    const { activeSet, inactiveSet } = status;

    for (const sub of items) {
      const username =
        sub.usersPPPOE?.[0]?.username?.trim() || sub.number?.trim();
      if (!username) continue;

      const normalizedUsername = normalizeRouterUsername(username);
      if (!normalizedUsername) continue;

      const isActive = activeSet.has(normalizedUsername);
      const isInactive = inactiveSet.has(normalizedUsername);

      if (isInactive) {
        try {
          await runTriggers("INACTIVE_CONNECTION", sub.id);
          processed++;
        } catch (error) {
          console.error(
            "❌ Gagal menjalankan trigger INACTIVE_CONNECTION",
            sub.id,
            error
          );
        }
      }

      const shouldUpdateOnlineStatus =
        sub.lastOnlineStatus !== isActive;
      if (shouldUpdateOnlineStatus) {
        if (isActive && !sub.lastOnlineStatus) {
          console.info(
            `ℹ️ Deteksi koneksi aktif baru untuk subscription ${sub.id}`
          );
          try {
            await runTriggers("ACTIVE_CONNECTION", sub.id);
            processed++;
          } catch (error) {
            console.error(
              "❌ Gagal menjalankan trigger ACTIVE_CONNECTION",
              sub.id,
              error
            );
          }
        }
        try {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { lastOnlineStatus: isActive },
          });
        } catch (error) {
          console.error(
            "❌ Gagal mengupdate lastOnlineStatus",
            sub.id,
            error
          );
        }
      }
    }
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
