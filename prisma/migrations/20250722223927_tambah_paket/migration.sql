-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "routerId" TEXT NOT NULL,
    "poolName" TEXT NOT NULL,
    "localAddress" TEXT NOT NULL,
    "rateLimit" TEXT,
    "price" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Package_name_key" ON "Package"("name");

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_routerId_fkey" FOREIGN KEY ("routerId") REFERENCES "Router"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
