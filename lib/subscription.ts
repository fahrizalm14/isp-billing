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

  // jika tidak ada user PPPOE maka buat baru
  if (!subscription.usersPPPOE.length) {
    // generate user
    const userPPPOE = {
      name: generateRandomPrefix("pppoe", 4),
      password: generateRandomPrefix("pppoe", 4),
      profile: subscription?.package.name || "",
    };

    // buat user pppoe di mikrotik
    await createUserPPPOE(
      {
        host: subscription?.package.router.ipAddress || "",
        username: subscription?.package.router.apiUsername || "",
        password: decrypt(subscription?.package.router.apiPassword || ""),
        port: Number(subscription?.package.router.port) || 22,
      },
      {
        name: userPPPOE.name,
        password: userPPPOE.password,
        profile: userPPPOE.profile,
      }
    );
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
    await movePPPOEToProfile(
      {
        host: subscription?.package.router.ipAddress || "",
        username: subscription?.package.router.apiUsername || "",
        password: decrypt(subscription?.package.router.apiPassword || ""),
        port: Number(subscription?.package.router.port) || 22,
      },
      {
        profile: subscription.package.name,
        name: subscription.usersPPPOE[0].username,
      }
    );
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

  await movePPPOEToProfile(
    {
      host: subscription?.package.router.ipAddress || "",
      username: subscription?.package.router.apiUsername || "",
      password: decrypt(subscription?.package.router.apiPassword || ""),
      port: Number(subscription?.package.router.port) || 22,
    },
    {
      profile: "isolir",
      name: subscription.usersPPPOE[0].username,
    }
  );
  await runTriggers("DEACTIVATE_SUBSCRIPTION", subscriptionId);
};
