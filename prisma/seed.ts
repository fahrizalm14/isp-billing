import { prisma } from "@/lib/prisma";

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  // ==== Hapus semua data lama (urut sesuai relasi) ====
  await prisma.cashflow.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.package.deleteMany();
  await prisma.odp.deleteMany();
  await prisma.router.deleteMany();
  await prisma.userProfile.deleteMany();

  // ==== BUAT ROUTER (1) ====
  const router = await prisma.router.create({
    data: {
      name: "Router-1",
      ipAddress: "192.168.1.1",
      apiUsername: "admin",
      apiPassword: "admin",
      port: 8728,
    },
  });

  // ==== BUAT USER PROFILE (10) ====
  const profiles = [];
  for (let i = 1; i <= 10; i++) {
    const profile = await prisma.userProfile.create({
      data: {
        name: `Customer ${i}`,
        phone: `08123${i}56789`,
      },
    });
    profiles.push(profile);
  }

  // ==== BUAT ODP (5, semua pakai router yang sama) ====
  const odps = [];
  for (let i = 1; i <= 5; i++) {
    const odp = await prisma.odp.create({
      data: {
        name: `ODP-${i}`,
        location: `Lokasi ${i}`,
        region: `Region ${i}`,
        capacity: Math.floor(Math.random() * 20) + 5,
        routerId: router.id,
      },
    });
    odps.push(odp);
  }

  // ==== BUAT PAKET (6, semua pakai router tunggal) ====
  const packages = [];
  for (let i = 1; i <= 6; i++) {
    const pkg = await prisma.package.create({
      data: {
        name: `PAKET-${i}`,
        description: `Paket internet ${i}`,
        routerId: router.id,
        poolName: `POOL-${i}`,
        localAddress: `10.10.${i}.1`,
        rateLimit: `${10 * i}M/${10 * i}M`,
        price: 100000 * i,
      },
    });
    packages.push(pkg);
  }

  // ==== BUAT SUBSCRIPTION (1 per profile) ====
  const subscriptions = [];
  for (let i = 0; i < profiles.length; i++) {
    const sub = await prisma.subscription.create({
      data: {
        number: `SUB-${String(i + 1).padStart(4, "0")}`,
        userProfileId: profiles[i].id,
        odpId: getRandom(odps).id,
        packageId: getRandom(packages).id,
        active: true,
        dueDate: "2025-09-20",
        expiredAt: new Date("2025-10-20"),
      },
    });
    subscriptions.push(sub);
  }

  // ==== BUAT PAYMENT & CASHFLOW (100 data) ====
  for (let i = 0; i < 100; i++) {
    const sub = getRandom(subscriptions);
    const pkg = getRandom(packages);

    const pay = await prisma.payment.create({
      data: {
        number: `PAY-${String(i + 1).padStart(5, "0")}`,
        subscriptionId: sub.id,
        amount: pkg.price,
        tax: 0,
        status: "SUCCESS",
        paymentMethod: "manual",
      },
    });

    await prisma.cashflow.create({
      data: {
        amount: pay.amount,
        type: "INCOME",
        date: new Date(),
        description: `Pembayaran untuk ${sub.number}`,
        paymentId: pay.id,
        reference: pay.number,
      },
    });
  }

  console.log("✅ Seeding selesai dengan 1 Router!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
