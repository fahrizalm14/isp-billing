-- AlterTable
ALTER TABLE `Payment` ADD COLUMN `discount` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Subscription` ADD COLUMN `discount` INTEGER NOT NULL DEFAULT 0;
