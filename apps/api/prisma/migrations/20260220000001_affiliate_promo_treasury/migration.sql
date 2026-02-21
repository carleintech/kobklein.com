-- Migration: Add affiliate tracking to FxPromotion + ensure SystemUser for Treasury

-- 1. Add affiliate fields to FxPromotion
ALTER TABLE "FxPromotion" ADD COLUMN IF NOT EXISTS "affiliateUserId" TEXT;
ALTER TABLE "FxPromotion" ADD COLUMN IF NOT EXISTS "affiliatePct"    DECIMAL(8,4);
ALTER TABLE "FxPromotion" ADD COLUMN IF NOT EXISTS "affiliateLabel"  TEXT;

-- Index for affiliate lookup
CREATE INDEX IF NOT EXISTS "FxPromotion_affiliateUserId_idx" ON "FxPromotion"("affiliateUserId");

-- 2. Add affiliateId + savedAmount to FxPromoRedemption (track which affiliate drove it)
ALTER TABLE "FxPromoRedemption" ADD COLUMN IF NOT EXISTS "affiliateUserId" TEXT;
ALTER TABLE "FxPromoRedemption" ADD COLUMN IF NOT EXISTS "affiliatePaid"   BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS "FxPromoRedemption_affiliateUserId_idx" ON "FxPromoRedemption"("affiliateUserId");

-- 3. Ensure Wallet supports TREASURY type (enum already has it in schema)
-- The WalletType enum update is handled by Prisma; this is just the data migration.

-- 4. Add a dedicated system user + treasury wallet seed (idempotent)
-- NOTE: actual seeding is done via the seed script; this migration just adds columns.

-- 5. Add referralCode to User (for affiliate referral tracking)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralCode"  TEXT UNIQUE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referredBy"    TEXT;

CREATE INDEX IF NOT EXISTS "User_referralCode_idx" ON "User"("referralCode");
CREATE INDEX IF NOT EXISTS "User_referredBy_idx"   ON "User"("referredBy");
