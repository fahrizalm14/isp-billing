-- DropForeignKey
ALTER TABLE "UserProfile" DROP CONSTRAINT "UserProfile_userId_fkey";

-- AlterTable
ALTER TABLE "UserProfile" ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
