/*
  Warnings:

  - You are about to drop the column `number` on the `Package` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Package" DROP COLUMN "number";

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "number" TEXT NOT NULL DEFAULT '';
