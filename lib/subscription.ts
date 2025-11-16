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
  console.log(
    "🔵 [ACTIVATE] Starting activation for subscription:",
    subscriptionId
  );

  const _expiredAt = getNextDueDate(
    new Date(dueDate || new Date()),
    expiredAt || new Date()
  );

  console.log("🔵 [ACTIVATE] Fetching subscription data...");
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

  if (!subscription) {
    console.error("❌ [ACTIVATE] Subscription not found:", subscriptionId);
    throw new Error("Langganan tidak ditemukan!");
  }

  console.log("✅ [ACTIVATE] Subscription found:", {
    number: subscription.number,
    packageName: subscription.package.name,
    hasRouter: !!subscription.package.router,
    hasPPPOE: subscription.usersPPPOE.length > 0,
  });

  // Validasi router configuration
  console.log("🔵 [ACTIVATE] Validating router configuration...");
  if (!subscription.package.router) {
    console.error("❌ [ACTIVATE] Router not found for package");
    throw new Error("Router tidak ditemukan untuk paket ini");
  }

  if (!subscription.package.router.ipAddress) {
    console.error("❌ [ACTIVATE] Router IP address is invalid");
    throw new Error("IP Address router tidak valid");
  }

  const routerConfig = {
    host: subscription.package.router.ipAddress,
    username: subscription.package.router.apiUsername || "",
    password: decrypt(subscription.package.router.apiPassword || ""),
    port: Number(subscription.package.router.port) || 65534,
  };

  console.log("✅ [ACTIVATE] Router config:", {
    host: routerConfig.host,
    username: routerConfig.username,
    port: routerConfig.port,
  });

  // jika tidak ada user PPPOE maka buat baru
  if (!subscription.usersPPPOE.length) {
    console.log("🔵 [ACTIVATE] No existing PPPoE user, creating new one...");
    const web = await prisma.websiteInfo.findFirst();

    if (!subscription.package.name) {
      console.error("❌ [ACTIVATE] MikroTik profile not found for package");
      throw new Error("Profile MikroTik untuk paket tidak ditemukan");
    }

    // generate user
    const userPPPOE = {
      name: subscription.number,
      password: generateRandomPrefix(
        (web?.alias || "pppoe").replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
        5
      ),
      profile: subscription.package.name,
      localAddress: subscription.package.localAddress,
    };

    console.log("✅ [ACTIVATE] Generated PPPoE user:", {
      name: userPPPOE.name,
      profile: userPPPOE.profile,
    });

    try {
      // buat user pppoe di mikrotik
      console.log("🔵 [ACTIVATE] Creating PPPoE user in MikroTik...");
      await createUserPPPOE(routerConfig, {
        name: userPPPOE.name,
        password: userPPPOE.password,
        profile: userPPPOE.profile,
        // localAddress: userPPPOE.localAddress,
      });
      console.log("✅ [ACTIVATE] PPPoE user created in MikroTik");

      // create table user pppoe (tanpa update status, akan diupdate di akhir)
      console.log("🔵 [ACTIVATE] Saving PPPoE user to database...");
      await prisma.subscription.update({
        data: {
          usersPPPOE: {
            create: {
              password: userPPPOE.password,
              username: userPPPOE.name,
            },
          },
        },
        where: { id: subscription.id || "" },
      });
      console.log("✅ [ACTIVATE] PPPoE user saved to database");
    } catch (error) {
      console.error("❌ [ACTIVATE] Failed to create PPPoE user:", error);
      throw error;
    }
  } else {
    console.log("🔵 [ACTIVATE] PPPoE user exists, moving to active profile...");

    const targetProfile = subscription.package.name;
    if (!targetProfile) {
      console.error("❌ [ACTIVATE] Target profile not found for package");
      throw new Error("Profile MikroTik untuk paket tidak ditemukan");
    }

    const existingUser = subscription.usersPPPOE[0];
    if (!existingUser) {
      console.error("❌ [ACTIVATE] PPPoE user not found in database");
      throw new Error("User PPPoE untuk langganan belum tersedia");
    }

    console.log("🔵 [ACTIVATE] Moving PPPoE user to profile:", {
      username: existingUser.username,
      targetProfile,
    });

    try {
      await movePPPOEToProfile(routerConfig, {
        profile: targetProfile,
        name: existingUser.username,
      });

      console.log("✅ [ACTIVATE] PPPoE user moved to active profile");
    } catch (error) {
      console.error("❌ [ACTIVATE] Failed to move PPPoE profile:", error);
      throw error;
    }
  }

  // update status
  console.log("🔵 [ACTIVATE] Updating subscription status to active...");
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      active: true,
      expiredAt: new Date(_expiredAt),
      dueDate: dueDate ? dueDate : formatDate(new Date()),
    },
  });
  console.log("✅ [ACTIVATE] Subscription status updated");

  console.log("🔵 [ACTIVATE] Running activation triggers...");
  await runTriggers("ACTIVATE_SUBSCRIPTION", subscriptionId);
  console.log("✅ [ACTIVATE] Activation completed successfully");

  return _expiredAt;
};

export const deactivateSubscription = async (
  subscriptionId: string,
  isAudited = false
) => {
  console.log(
    "🔴 [DEACTIVATE] Starting deactivation for subscription:",
    subscriptionId
  );

  // Fetch subscription first untuk validasi
  console.log("🔴 [DEACTIVATE] Fetching subscription data...");
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

  if (!subscription) {
    console.error("❌ [DEACTIVATE] Subscription not found:", subscriptionId);
    throw new Error("Langganan tidak ditemukan!");
  }

  console.log("✅ [DEACTIVATE] Subscription found:", {
    number: subscription.number,
    packageName: subscription.package.name,
    currentStatus: subscription.active ? "active" : "inactive",
    hasRouter: !!subscription.package.router,
    hasPPPOE: subscription.usersPPPOE.length > 0,
  });

  // Validasi router configuration
  console.log("🔴 [DEACTIVATE] Validating router configuration...");
  if (!subscription.package.router) {
    console.error("❌ [DEACTIVATE] Router not found for package");
    throw new Error("Router tidak ditemukan untuk paket ini");
  }

  if (!subscription.package.router.ipAddress) {
    console.error("❌ [DEACTIVATE] Router IP address is invalid");
    throw new Error("IP Address router tidak valid");
  }

  const existingUser = subscription.usersPPPOE[0];
  if (!existingUser) {
    console.error("❌ [DEACTIVATE] PPPoE user not found in database");
    throw new Error("User PPPoE untuk langganan belum tersedia");
  }

  const routerConfig = {
    host: subscription.package.router.ipAddress,
    username: subscription.package.router.apiUsername || "",
    password: decrypt(subscription.package.router.apiPassword || ""),
    port: Number(subscription.package.router.port) || 65534,
  };

  console.log("✅ [DEACTIVATE] Router config:", {
    host: routerConfig.host,
    username: routerConfig.username,
    port: routerConfig.port,
  });

  console.log("🔴 [DEACTIVATE] Moving PPPoE user to isolir profile:", {
    username: existingUser.username,
    targetProfile: "isolir",
  });

  try {
    await movePPPOEToProfile(routerConfig, {
      profile: "isolir",
      name: existingUser.username,
    });

    console.log("✅ [DEACTIVATE] PPPoE user moved to isolir profile");

    // Update status SETELAH berhasil move profile
    console.log("🔴 [DEACTIVATE] Updating subscription status to inactive...");
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        active: false,
        isAudited,
        expiredAt: new Date(),
      },
    });
    console.log("✅ [DEACTIVATE] Subscription status updated");

    console.log("🔴 [DEACTIVATE] Running deactivation triggers...");
    await runTriggers("DEACTIVATE_SUBSCRIPTION", subscriptionId);
    console.log("✅ [DEACTIVATE] Deactivation completed successfully");
  } catch (error) {
    console.error("❌ [DEACTIVATE] Failed to move profile:", error);
    console.error(
      "⚠️ [DEACTIVATE] Subscription status NOT changed due to error"
    );
    throw error;
  }
};
