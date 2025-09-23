import { createId } from "@paralleldrive/cuid2";
import midtransClient from "midtrans-client";
import { PaymentStatus } from "./generated/prisma";
import { generatePaymentNumber } from "./numbering";
import { prisma } from "./prisma";
import { runTriggers } from "./runTriggers";

interface IGetPaymentLink {
  id: string;
  amount: number;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
}

export const getPaymentLink = async ({
  amount,
  customer,
  id,
  items,
}: IGetPaymentLink) => {
  const info = await prisma.websiteInfo.findFirst();

  const snap = new midtransClient.Snap({
    isProduction: process.env.NODE_ENV === "production",
    serverKey: info?.midtransServerKey,
    clientKey: info?.midtransSecretKey,
  });

  const paymentLinkParams = {
    transaction_details: {
      order_id: id,
      gross_amount: amount,
    },
    item_details: items,
    customer_details: {
      first_name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
    usage_limit: 1,
    expiry: {
      unit: "days",
      duration: 1,
    },
  };

  return await snap.createTransactionRedirectUrl(paymentLinkParams);
};

interface IBilling {
  id: string;
  subscriptionId: string;
  status: PaymentStatus;
  // packageName: string;
  // mikrotik: {
  //   host: string;
  //   port: number;
  //   username: string;
  //   password: string;
  // };
  transactionId?: string;
}

export const billing = async ({
  id,
  status,
  subscriptionId,
  transactionId,
}: IBilling) => {
  const subscription = await prisma.subscription.findUnique({
    where: {
      id: subscriptionId,
    },
    include: {
      userProfile: true,
      package: true,
    },
  });

  if (!subscription) throw new Error("Langganan tidak tersedia!");

  const payment = await prisma.payment.findFirst({
    where: { id },
  });

  if (!payment) throw new Error("Pembayaran tidak tersedia!");

  // update payment
  await prisma.payment.update({
    where: { id }, // pastikan unique
    data: {
      status,
      transactionId,
      Cashflow: {
        create: {
          amount: payment.amount,
          type: "INCOME",
          description: `${subscription.number}- ${subscription.userProfile.name}`,
          reference: payment.number,
        },
      },
    },
  });

  await runTriggers("PAYMENT_SUCCESS", subscriptionId);
};

export function getNextDueDate(
  initialDueDate: Date, // tanggal kontrak (jadi patokan hari tagihan)
  activationDate: Date // tanggal jatuh tempo terakhir
): string {
  // Ambil hari dari kontrak (misal 31)
  const billDay = initialDueDate.getDate();

  // Geser ke bulan berikutnya dari activationDate
  const nextMonth = new Date(
    activationDate.getFullYear(),
    activationDate.getMonth() + 1,
    1 // awal bulan
  );

  // Cari hari terakhir bulan target
  const lastDayOfMonth = new Date(
    nextMonth.getFullYear(),
    nextMonth.getMonth() + 1,
    0
  ).getDate();

  // Tentukan tanggal jatuh tempo
  nextMonth.setDate(Math.min(billDay, lastDayOfMonth));

  // Format YYYY-MM-DD
  const yyyy = nextMonth.getFullYear();
  const mm = String(nextMonth.getMonth() + 1).padStart(2, "0");
  const dd = String(nextMonth.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

export const generateInvoiceForSubscription = async (
  subscriptionId: string,
  amount: number,
  expiredAt: Date,
  customer: {
    name: string;
    phone: string;
    email: string;
  },
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[]
) => {
  const id = createId();
  const paymentLink = await getPaymentLink({
    id,
    customer,
    amount,
    items,
  });
  const invoice = await prisma.payment.create({
    data: {
      subscriptionId,
      amount: amount, // Ganti dengan jumlah yang sesuai
      expiredAt: new Date(new Date().setDate(new Date().getDate() + 1)), // Contoh: 1 hari dari sekarang
      status: "PENDING", // Atur status awal
      tax: 0,
      paymentLink,
    },
    include: {
      subscription: {
        select: { number: true },
      },
    },
  });

  // 🔥 Kirim WA setelah invoice dibuat

  await runTriggers("INVOICE_CREATED", subscriptionId);

  return invoice;
};

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // +1 karena month 0–11
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function createPayment({
  amount,
  taxAmount,
  validPhoneNumber,
  customerName,
  packageId,
  packageName,
  subscriptionId,
}: {
  amount: number;
  taxAmount: number;
  validPhoneNumber: string;
  customerName: string;
  email: string;
  packageId: string;
  packageName: string;
  subscriptionId: string;
}) {
  const id = createId();
  const number = await generatePaymentNumber();

  const paymentLink = await getPaymentLink({
    amount,
    id,
    customer: {
      email: `${customerName.split(" ").join("")}@mail.id`,
      name: customerName,
      phone: validPhoneNumber,
    },
    items: [
      {
        id: packageId,
        name: packageName,
        price: amount,
        quantity: 1,
      },
    ],
  });

  await prisma.payment.create({
    data: {
      id,
      amount,
      tax: taxAmount,
      number,
      paymentLink,
      paymentMethod: "",
      subscriptionId,
    },
  });

  // todo whatsapp pelanggan (pendaftaran berhasil dan kirim link pembayaran)

  await runTriggers("INVOICE_CREATED", subscriptionId);
}
