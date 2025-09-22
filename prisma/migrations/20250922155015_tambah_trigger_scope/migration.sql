-- CreateEnum
CREATE TYPE "TriggerScope" AS ENUM ('ADMIN', 'SUPPORT', 'USER');

-- AlterTable
ALTER TABLE "Trigger" ADD COLUMN     "scope" "TriggerScope" NOT NULL DEFAULT 'ADMIN';
