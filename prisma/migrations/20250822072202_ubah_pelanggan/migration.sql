/*
  Warnings:

  - Added the required column `tax` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dueDate` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'TECHNICIAN';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "tax" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "dueDate" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "name" TEXT NOT NULL DEFAULT '';
