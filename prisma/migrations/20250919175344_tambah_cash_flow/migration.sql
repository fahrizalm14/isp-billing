-- CreateEnum
CREATE TYPE "CashflowType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateTable
CREATE TABLE "Cashflow" (
    "id" TEXT NOT NULL,
    "type" "CashflowType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cashflow_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Cashflow" ADD CONSTRAINT "Cashflow_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
