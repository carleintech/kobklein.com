-- AlterTable
ALTER TABLE "User" ADD COLUMN     "kycTier" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "LimitConfig" (
    "id" TEXT NOT NULL,
    "tier" INTEGER NOT NULL,
    "dailySend" DOUBLE PRECISION NOT NULL,
    "monthlySend" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "LimitConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LimitConfig_tier_key" ON "LimitConfig"("tier");
