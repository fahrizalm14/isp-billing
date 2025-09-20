-- CreateTable
CREATE TABLE "UserPPPOE" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,

    CONSTRAINT "UserPPPOE_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UserPPPOE" ADD CONSTRAINT "UserPPPOE_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
