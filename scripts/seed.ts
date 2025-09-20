// import { PrismaClient, Role, UserStatus } from "@/lib/generated/prisma"; // path ke prisma client kamu

import { Role, UserStatus } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import { faker } from "@faker-js/faker";

async function seedUsers() {
  const users = Array.from({ length: 50 }).map(() => ({
    email: faker.internet.email(),
    password: faker.internet.password(), // ganti hash kalau perlu
    name: faker.person.fullName(),
    role: Role.CUSTOMER, // bisa random kalau mau
    status: UserStatus.PENDING, // bisa random juga
  }));

  const created = await prisma.user.createMany({
    data: users,
    skipDuplicates: true, // Removed because it's not supported in your Prisma schema
  });

  console.log(`✅ ${created.count} users created.`);
}

// async function seedRouter() {
//   const dummyRouters = Array.from({ length: 20 }, () => ({
//     id: faker.string.uuid(),
//     name: `Router ${faker.string.alpha({ casing: "upper", length: 1 })}`,
//     ipAddress: faker.internet.ipv4(),
//     apiUsername: "admin",
//     apiPassword: faker.internet.password({ length: 10 }),
//     port: faker.internet.port(),
//     description: faker.lorem.sentence(),
//     status: faker.datatype.boolean(),
//     updatedAt: faker.date.recent({ days: 10 }),
//   }));

//   const created = await prisma.router.createMany({
//     data: dummyRouters,
//     skipDuplicates: true, // Removed because it's not supported in your Prisma schema
//   });

//   console.log(`✅ ${created.count} router created.`);
// }

seedUsers()
  .catch((e) => {
    console.error("❌ Error seeding users:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

// seedRouter()
//   .catch((e) => {
//     console.error("❌ Error seeding routers:", e);
//     process.exit(1);
//   })
//   .finally(() => prisma.$disconnect());

// async function main() {
//   // Buat 5 router sebagai pilihan
//   const routers = await prisma.router.findMany();

//   // Buat 50 ODP
//   await Promise.all(
//     Array.from({ length: 50 }).map((_, i) =>
//       prisma.odp.create({
//         data: {
//           name: `ODP-${i + 1}`,
//           location: faker.location.streetAddress(),
//           longitude: `${faker.location.longitude()}`,
//           latitude: `${faker.location.latitude()}`,
//           region: `Kec. ${faker.location.city()}`,
//           capacity: faker.number.int({ min: 10, max: 100 }),
//           routerId: routers[Math.floor(Math.random() * routers.length)].id,
//         },
//       })
//     )
//   );

//   console.log("✅ Seed selesai");
// }

// main()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(() => prisma.$disconnect());

// async function main() {
//   const routers = await prisma.router.findMany();

//   if (routers.length === 0) {
//     throw new Error("No routers found. Please seed routers first.");
//   }

//   const packages = Array.from({ length: 50 }).map(() => {
//     const randomRouter = routers[Math.floor(Math.random() * routers.length)];

//     return {
//       name: faker.commerce.productName() + "-" + faker.string.alphanumeric(5),
//       description: faker.commerce.productDescription(),
//       routerId: randomRouter.id,
//       poolName: faker.internet.domainWord(),
//       localAddress: faker.internet.ip(),
//       rateLimit: `${faker.number.int({ min: 1, max: 10 })}M/${faker.number.int({
//         min: 1,
//         max: 10,
//       })}M`,
//       price: faker.number.int({ min: 5000, max: 100000 }),
//       active: faker.datatype.boolean(),
//     };
//   });

//   await prisma.package.createMany({
//     data: packages,
//     skipDuplicates: true,
//   });

//   console.log("✅ Seeded 50 packages.");
// }

// main()
//   .catch((e) => {
//     console.error("❌ Seeding error:", e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
