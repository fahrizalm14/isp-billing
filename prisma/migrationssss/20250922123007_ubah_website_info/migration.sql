/*
  Warnings:

  - You are about to drop the column `messageApiSecret` on the `WebsiteInfo` table. All the data in the column will be lost.
  - You are about to drop the column `messageApiToken` on the `WebsiteInfo` table. All the data in the column will be lost.
  - You are about to drop the column `messageApiUrl` on the `WebsiteInfo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WebsiteInfo" DROP COLUMN "messageApiSecret",
DROP COLUMN "messageApiToken",
DROP COLUMN "messageApiUrl",
ADD COLUMN     "apiKey" TEXT,
ADD COLUMN     "apiSecret" TEXT,
ADD COLUMN     "apiUrl" TEXT;
