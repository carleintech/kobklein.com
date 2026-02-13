-- AlterTable
ALTER TABLE "Distributor" ADD COLUMN     "floatLowThreshold" DOUBLE PRECISION NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE "Withdrawal" ADD COLUMN     "feeAmount" DECIMAL(18,2),
ADD COLUMN     "netAmount" DECIMAL(18,2);
