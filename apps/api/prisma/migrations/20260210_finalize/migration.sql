-- Finalize: add all new models and extend existing ones
-- KobKlein v2 schema expansion

-- ── Extend WalletType enum ─────────────────────────────────────────
ALTER TYPE "WalletType" ADD VALUE IF NOT EXISTS 'TREASURY';

-- ── Extend User table ──────────────────────────────────────────────
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstName"    TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastName"     TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email"        TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "handle"       TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "kycStatus"    TEXT NOT NULL DEFAULT 'none';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isFrozen"     BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "freezeReason" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "frozenAt"     TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "User_handle_key" ON "User"("handle");

-- ── Extend Distributor table ───────────────────────────────────────
ALTER TABLE "Distributor" ADD COLUMN IF NOT EXISTS "lastLowFloatAlertAt" TIMESTAMP(3);

-- ── TransferContact ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "TransferContact" (
    "id"             TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId"         TEXT NOT NULL,
    "contactUserId"  TEXT NOT NULL,
    "nickname"       TEXT,
    "transferCount"  INTEGER NOT NULL DEFAULT 1,
    "lastTransferAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TransferContact_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TransferContact_userId_contactUserId_key" ON "TransferContact"("userId", "contactUserId");
ALTER TABLE "TransferContact" ADD CONSTRAINT "TransferContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TransferContact" ADD CONSTRAINT "TransferContact_contactUserId_fkey" FOREIGN KEY ("contactUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── OtpCode ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "OtpCode" (
    "id"          TEXT NOT NULL DEFAULT gen_random_uuid(),
    "phone"       TEXT NOT NULL,
    "code"        TEXT NOT NULL,
    "purpose"     TEXT NOT NULL,
    "attempts"    INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "expiresAt"   TIMESTAMP(3) NOT NULL,
    "usedAt"      TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

-- ── Merchant ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Merchant" (
    "id"           TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId"       TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "paymentCode"  TEXT NOT NULL,
    "logoUrl"      TEXT,
    "phone"        TEXT NOT NULL,
    "category"     TEXT,
    "kycStatus"    TEXT NOT NULL DEFAULT 'pending',
    "status"       TEXT NOT NULL DEFAULT 'active',
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Merchant_userId_key" ON "Merchant"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Merchant_paymentCode_key" ON "Merchant"("paymentCode");
ALTER TABLE "Merchant" ADD CONSTRAINT "Merchant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── MerchantWithdrawal ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "MerchantWithdrawal" (
    "id"            TEXT NOT NULL DEFAULT gen_random_uuid(),
    "merchantId"    TEXT NOT NULL,
    "walletId"      TEXT NOT NULL,
    "distributorId" TEXT,
    "amount"        DECIMAL(18,2) NOT NULL,
    "currency"      TEXT NOT NULL,
    "status"        TEXT NOT NULL DEFAULT 'pending',
    "code"          TEXT NOT NULL,
    "expiresAt"     TIMESTAMP(3) NOT NULL,
    "feeAmount"     DECIMAL(18,2),
    "netAmount"     DECIMAL(18,2),
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MerchantWithdrawal_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MerchantWithdrawal_code_key" ON "MerchantWithdrawal"("code");
ALTER TABLE "MerchantWithdrawal" ADD CONSTRAINT "MerchantWithdrawal_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── DeviceSession ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "DeviceSession" (
    "id"          TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId"      TEXT NOT NULL,
    "fingerprint" TEXT,
    "ip"          TEXT NOT NULL,
    "userAgent"   TEXT,
    "lastSeenAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trusted"     BOOLEAN NOT NULL DEFAULT false,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeviceSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "DeviceSession_userId_fingerprint_key" ON "DeviceSession"("userId", "fingerprint");
ALTER TABLE "DeviceSession" ADD CONSTRAINT "DeviceSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Notification (in-app) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "Notification" (
    "id"        TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId"    TEXT NOT NULL,
    "title"     TEXT NOT NULL,
    "body"      TEXT NOT NULL,
    "type"      TEXT NOT NULL,
    "read"      BOOLEAN NOT NULL DEFAULT false,
    "data"      JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── PaymentRequest ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "PaymentRequest" (
    "id"          TEXT NOT NULL DEFAULT gen_random_uuid(),
    "requesterId" TEXT NOT NULL,
    "requesteeId" TEXT NOT NULL,
    "amount"      DOUBLE PRECISION NOT NULL,
    "currency"    TEXT NOT NULL DEFAULT 'HTG',
    "note"        TEXT,
    "status"      TEXT NOT NULL DEFAULT 'pending',
    "paidAt"      TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentRequest_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentRequest" ADD CONSTRAINT "PaymentRequest_requesteeId_fkey" FOREIGN KEY ("requesteeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── ReceiveCode ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "ReceiveCode" (
    "id"        TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId"    TEXT NOT NULL,
    "code"      TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReceiveCode_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ReceiveCode_code_key" ON "ReceiveCode"("code");
ALTER TABLE "ReceiveCode" ADD CONSTRAINT "ReceiveCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── RecipientInteraction ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "RecipientInteraction" (
    "id"              TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId"          TEXT NOT NULL,
    "recipientUserId" TEXT NOT NULL,
    "interactionType" TEXT NOT NULL,
    "amount"          DOUBLE PRECISION NOT NULL,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecipientInteraction_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "RecipientInteraction_userId_recipientUserId_idx" ON "RecipientInteraction"("userId", "recipientUserId");

-- ── KycProfile ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "KycProfile" (
    "id"              TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId"          TEXT NOT NULL,
    "documentType"    TEXT,
    "documentUrl"     TEXT,
    "selfieUrl"       TEXT,
    "addressProof"    TEXT,
    "submittedAt"     TIMESTAMP(3),
    "reviewedAt"      TIMESTAMP(3),
    "reviewedBy"      TEXT,
    "rejectionReason" TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KycProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "KycProfile_userId_key" ON "KycProfile"("userId");
ALTER TABLE "KycProfile" ADD CONSTRAINT "KycProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── FeeConfig ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "FeeConfig" (
    "id"       TEXT NOT NULL DEFAULT gen_random_uuid(),
    "type"     TEXT NOT NULL,
    "percent"  DOUBLE PRECISION NOT NULL DEFAULT 0,
    "flat"     DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'HTG',
    "active"   BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeeConfig_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FeeConfig_type_currency_key" ON "FeeConfig"("type", "currency");

-- ── FloatRefillLog ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "FloatRefillLog" (
    "id"            TEXT NOT NULL DEFAULT gen_random_uuid(),
    "distributorId" TEXT NOT NULL,
    "amount"        DECIMAL(18,2) NOT NULL,
    "currency"      TEXT NOT NULL,
    "performedBy"   TEXT NOT NULL,
    "note"          TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FloatRefillLog_pkey" PRIMARY KEY ("id")
);

-- ── FloatTransfer ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "FloatTransfer" (
    "id"                TEXT NOT NULL DEFAULT gen_random_uuid(),
    "fromDistributorId" TEXT NOT NULL,
    "toDistributorId"   TEXT NOT NULL,
    "amount"            DECIMAL(18,2) NOT NULL,
    "currency"          TEXT NOT NULL,
    "status"            TEXT NOT NULL DEFAULT 'completed',
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FloatTransfer_pkey" PRIMARY KEY ("id")
);

-- ── OtpChallenge ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "OtpChallenge" (
    "id"         TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId"     TEXT NOT NULL,
    "transferId" TEXT,
    "reason"     TEXT NOT NULL,
    "otpCode"    TEXT NOT NULL,
    "status"     TEXT NOT NULL DEFAULT 'pending',
    "expiresAt"  TIMESTAMP(3) NOT NULL,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);

-- ── UnlockRequest ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "UnlockRequest" (
    "id"         TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId"     TEXT NOT NULL,
    "reason"     TEXT NOT NULL,
    "status"     TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UnlockRequest_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "UnlockRequest" ADD CONSTRAINT "UnlockRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── FamilyLink ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "FamilyLink" (
    "id"             TEXT NOT NULL DEFAULT gen_random_uuid(),
    "diasporaUserId" TEXT NOT NULL,
    "familyUserId"   TEXT NOT NULL,
    "nickname"       TEXT,
    "relationship"   TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FamilyLink_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "FamilyLink_diasporaUserId_familyUserId_key" ON "FamilyLink"("diasporaUserId", "familyUserId");
ALTER TABLE "FamilyLink" ADD CONSTRAINT "FamilyLink_diasporaUserId_fkey" FOREIGN KEY ("diasporaUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FamilyLink" ADD CONSTRAINT "FamilyLink_familyUserId_fkey" FOREIGN KEY ("familyUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── NotificationLog (formalize existing raw-SQL table) ─────────────
CREATE TABLE IF NOT EXISTS "NotificationLog" (
    "id"        TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId"    TEXT,
    "phone"     TEXT NOT NULL,
    "channel"   TEXT NOT NULL,
    "type"      TEXT NOT NULL,
    "body"      TEXT NOT NULL,
    "status"    TEXT NOT NULL DEFAULT 'queued',
    "sentAt"    TIMESTAMP(3),
    "error"     TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);
