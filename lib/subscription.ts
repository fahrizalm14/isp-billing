import { decrypt } from "./crypto";
import { createUserPPPOE, movePPPOEToProfile } from "./mikrotik/pppoe";
import { generateRandomPrefix } from "./numbering";
import { formatDate, getNextDueDate } from "./payment";
import { prisma } from "./prisma";
import { runTriggers } from "./runTriggers";

export const activateSubscription = async (
  subscriptionId: string,
  dueDate: string | null,
  expiredAt: Date | null
) => {
  const _expiredAt = getNextDueDate(
    new Date(dueDate || new Date()),
    expiredAt || new Date()
  );

  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },

    include: {
      package: {
        include: {
          router: true,
        },
      },
      usersPPPOE: true,
      userProfile: true,
    },
  });

  if (!subscription) throw new Error("Langganan tidak ditemukan!");

  // Validasi router configuration
  if (!subscription.package.router) {
    throw new Error("Router tidak ditemukan untuk paket ini");
  }

  if (!subscription.package.router.ipAddress) {
    throw new Error("IP Address router tidak valid");
  }

  const routerConfig = {
    host: subscription.package.router.ipAddress,
    username: subscription.package.router.apiUsername || "",
    password: decrypt(subscription.package.router.apiPassword || ""),
    port: Number(subscription.package.router.port) || 8728,
  };

  // jika tidak ada user PPPOE maka buat baru
  if (!subscription.usersPPPOE.length) {
    const web = await prisma.websiteInfo.findFirst();

    if (!subscription.package.profileName) {
      throw new Error("Profile MikroTik untuk paket tidak ditemukan");
    }

    // generate user
    const userPPPOE = {
      name: subscription.number,
      password: generateRandomPrefix(
        (web?.alias || "pppoe").replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
        5
      ),
      profile: subscription.package.profileName,
      localAddress: subscription.package.localAddress,
    };

    // buat user pppoe di mikrotik
    await createUserPPPOE(routerConfig, {
      name: userPPPOE.name,
      password: userPPPOE.password,
      profile: userPPPOE.profile,
      // localAddress: userPPPOE.localAddress,
    });

    // create table user pppoe
    await prisma.subscription.update({
      data: {
        active: true,
        usersPPPOE: {
          create: {
            password: userPPPOE.password,
            username: userPPPOE.name,
          },
        },
      },
      where: { id: subscription.id || "" },
    });
  } else {
    const targetProfile = subscription.package.profileName;
    if (!targetProfile) {
      throw new Error("Profile MikroTik untuk paket tidak ditemukan");
    }

    const existingUser = subscription.usersPPPOE[0];
    if (!existingUser) {
      throw new Error("User PPPoE untuk langganan belum tersedia");
    }

    await movePPPOEToProfile(routerConfig, {
      profile: targetProfile,
      name: existingUser.username,
    });
  }

  // update status
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      active: true,
      expiredAt: new Date(_expiredAt),
      dueDate: dueDate ? dueDate : formatDate(new Date()),
    },
  });

  await runTriggers("ACTIVATE_SUBSCRIPTION", subscriptionId);
  return _expiredAt;
};

export const deactivateSubscription = async (
  subscriptionId: string,
  isAudited = false
) => {
  // update status
  const subscription = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      active: false,
      isAudited,
      expiredAt: new Date(), // tanggal expiredAt jadi tanggal sekarang
    },
    include: {
      package: {
        include: {
          router: true,
        },
      },
      usersPPPOE: true,
      userProfile: true,
    },
  });

  // Validasi router configuration
  if (!subscription.package.router) {
    throw new Error("Router tidak ditemukan untuk paket ini");
  }

  if (!subscription.package.router.ipAddress) {
    throw new Error("IP Address router tidak valid");
  }

  const existingUser = subscription.usersPPPOE[0];
  if (!existingUser) {
    throw new Error("User PPPoE untuk langganan belum tersedia");
  }

  const routerConfig = {
    host: subscription.package.router.ipAddress,
    username: subscription.package.router.apiUsername || "",
    password: decrypt(subscription.package.router.apiPassword || ""),
    port: Number(subscription.package.router.port) || 8728,
  };

  await movePPPOEToProfile(routerConfig, {
    profile: "isolir",
    name: existingUser.username,
  });

  await runTriggers("DEACTIVATE_SUBSCRIPTION", subscriptionId);
};
