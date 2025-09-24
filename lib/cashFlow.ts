import { prisma } from "./prisma";

export const createCashFlow = async ({
  amount,
  type,
  date,
  description,
  reference,
  paymentId,
}: {
  amount: number;
  type: "INCOME" | "EXPENSE"; // ✅ pakai union string literal
  date?: Date;
  description?: string;
  reference?: string;
  paymentId?: string;
}) => {
  const cashflow = await prisma.cashflow.create({
    data: {
      amount,
      type,
      date,
      description,
      reference,
      paymentId,
    },
  });

  return cashflow;
};

export const updateCashFlow = async (
  id: string,
  data: {
    amount?: number;
    type?: "INCOME" | "EXPENSE";
    date?: Date;
    description?: string;
    reference?: string;
    paymentId?: string | null; // bisa direset kalau null
  }
) => {
  const cashflow = await prisma.cashflow.update({
    where: { id },
    data,
  });

  return cashflow;
};

export const getCashFlows = async ({
  search,
  page = 1,
  limit = 10,
}: {
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const skip = (page - 1) * limit;

  const [cashflows, total] = await Promise.all([
    prisma.cashflow.findMany({
      where: search
        ? {
            OR: [
              { description: { contains: search } },
              { reference: { contains: search } },
            ],
          }
        : undefined,
      skip,
      take: limit,
      orderBy: { date: "desc" },
    }),
    prisma.cashflow.count({
      where: search
        ? {
            OR: [
              { description: { contains: search } },
              { reference: { contains: search } },
            ],
          }
        : undefined,
    }),
  ]);

  return {
    data: cashflows,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
};
