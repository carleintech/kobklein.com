-- Phase 10: Local Payment (MonCash/Natcom/Sogebank) + Supabase Realtime
-- Run this in Supabase SQL Editor

-- Create LocalPaymentTxn table
CREATE TABLE IF NOT EXISTS "LocalPaymentTxn" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "provider"    TEXT NOT NULL,
  "orderId"     TEXT NOT NULL,
  "amount"      DECIMAL(15,2) NOT NULL,
  "currency"    TEXT NOT NULL DEFAULT 'HTG',
  "direction"   TEXT NOT NULL,
  "status"      TEXT NOT NULL DEFAULT 'pending',
  "metadata"    JSONB,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "LocalPaymentTxn_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LocalPaymentTxn_provider_orderId_key" UNIQUE ("provider", "orderId")
);

ALTER TABLE "LocalPaymentTxn"
  ADD CONSTRAINT "LocalPaymentTxn_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "LocalPaymentTxn_userId_idx" ON "LocalPaymentTxn"("userId");
CREATE INDEX IF NOT EXISTS "LocalPaymentTxn_status_idx" ON "LocalPaymentTxn"("status");

-- Enable Supabase Realtime for live wallet balance + notification badge
ALTER TABLE "Wallet"       REPLICA IDENTITY FULL;
ALTER TABLE "Notification" REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE "Wallet";
ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";
