/*
  Warnings:

  - You are about to drop the column `userProfileId` on the `Payment` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_userProfileId_fkey";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "userProfileId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
