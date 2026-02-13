/*
  Warnings:

  - You are about to drop the column `fromId` on the `Transfer` table. All the data in the column will be lost.
  - You are about to drop the column `toId` on the `Transfer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `Transfer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `currency` to the `Transfer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fromWalletId` to the `Transfer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idempotencyKey` to the `Transfer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toWalletId` to the `Transfer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN     "transferId" TEXT;

-- AlterTable
ALTER TABLE "Transfer" DROP COLUMN "fromId",
DROP COLUMN "toId",
ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "fromWalletId" TEXT NOT NULL,
ADD COLUMN     "idempotencyKey" TEXT NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'posted',
ADD COLUMN     "toWalletId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_idempotencyKey_key" ON "Transfer"("idempotencyKey");
