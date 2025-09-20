import { decrypt } from "./crypto";
import { createUserPPPOE, movePPPOEToProfile } from "./mikrotik/pppoe";
import { generateRandomPrefix } from "./numbering";
import { formatDate, getNextDueDate } from "./payment";
import { prisma } from "./prisma";
import { sendMessage } from "./whatsapp";

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

  const message =
    `Halo ${subscription.userProfile.name},\n\n` +
    `Layanan internet Anda dengan paket *${subscription.package.name}* telah *dinonaktifkan* karena tagihan bulan ini belum dibayarkan.\n\n` +
    `Detail Akun:
- Nomor Langganan: ${subscription.number}\n\n` +
    `Silakan segera melakukan pembayaran agar layanan dapat diaktifkan kembali.\n` +
    `Jika Anda sudah melakukan pembayaran atau membutuhkan bantuan, silakan hubungi admin/teknisi.`;

  sendMessage(subscription.userProfile.phone || "", message);
};
