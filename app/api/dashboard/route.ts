import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  // default: bulan ini kalau tidak ada param
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const startDate = start ? new Date(start) : startOfMonth;
  const endDate = end ? new Date(end) : endOfMonth;

  // Pendapatan
  const income = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: {
      status: "SUCCESS",
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  // Pengeluaran
  const expense = await prisma.cashflow.aggregate({
    _sum: { amount: true },
    where: {
      type: "EXPENSE",
      date: { gte: startDate, lte: endDate },
    },
  });

  // Subscription aktif (total, bukan range waktu)
  const totalSubscriptions = await prisma.subscription.count({
    where: { active: true },
  });

  // Tagihan belum bayar (total rupiah)
  const unpaidBillsAgg = await prisma.payment.aggregate({
    _sum: { amount: true },
    where: { status: "PENDING" },
  });

  const unpaidBills = unpaidBillsAgg._sum.amount ?? 0;

  // Top paket berdasarkan subscription pada rentang waktu
  const topPackages = await prisma.subscription.groupBy({
    by: ["packageId"],
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });

  const packagesWithDetail = await prisma.package.findMany({
    where: { id: { in: topPackages.map((p) => p.packageId) } },
    select: { id: true, name: true, rateLimit: true, price: true },
  });

  const rankedPackages = topPackages.map((tp, idx) => {
    const pkg = packagesWithDetail.find((p) => p.id === tp.packageId);
    return {
      no: idx + 1,
      name: pkg?.name ?? "-",
      speed: pkg?.rateLimit ?? "-",
      price: pkg?.price ?? 0,
      customers: tp._count.id,
    };
  });

  return NextResponse.json({
    range: { start: startDate, end: endDate },
    income: income._sum.amount ?? 0,
    expense: expense._sum.amount ?? 0,
    totalSubscriptions,
    unpaidBills,
    topPackages: rankedPackages,
  });
}
