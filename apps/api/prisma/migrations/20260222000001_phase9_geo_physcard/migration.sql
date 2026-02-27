-- Phase 9: Geo coordinates + Physical Card Request
-- Run this in Supabase SQL Editor if prisma migrate dev is unavailable

-- Add lat/lng to Merchant
ALTER TABLE "Merchant"
  ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION;

-- Add lat/lng to Distributor
ALTER TABLE "Distributor"
  ADD COLUMN IF NOT EXISTS "lat" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "lng" DOUBLE PRECISION;

-- Create PhysicalCardRequest table
CREATE TABLE IF NOT EXISTS "PhysicalCardRequest" (
  "id"              TEXT NOT NULL,
  "userId"          TEXT NOT NULL,
  "cardholderName"  TEXT NOT NULL,
  "addressLine1"    TEXT NOT NULL,
  "addressLine2"    TEXT,
  "city"            TEXT NOT NULL,
  "postalCode"      TEXT,
  "country"         TEXT NOT NULL DEFAULT 'HT',
  "status"          TEXT NOT NULL DEFAULT 'pending',
  "trackingNum"     TEXT,
  "rejectionNote"   TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PhysicalCardRequest_pkey" PRIMARY KEY ("id")
);

-- Foreign key
ALTER TABLE "PhysicalCardRequest"
  ADD CONSTRAINT "PhysicalCardRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS "PhysicalCardRequest_userId_idx" ON "PhysicalCardRequest"("userId");
CREATE INDEX IF NOT EXISTS "PhysicalCardRequest_status_idx" ON "PhysicalCardRequest"("status");
