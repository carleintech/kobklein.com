-- Phase 14: Support Tickets
-- Run this in Supabase SQL Editor if prisma migrate dev is unavailable

CREATE TABLE IF NOT EXISTS "SupportTicket" (
  "id"          TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "subject"     TEXT NOT NULL,
  "body"        TEXT NOT NULL,
  "category"    TEXT NOT NULL DEFAULT 'general',
  "status"      TEXT NOT NULL DEFAULT 'open',
  "priority"    TEXT NOT NULL DEFAULT 'normal',
  "agentNotes"  TEXT,
  "resolvedAt"  TIMESTAMP(3),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SupportTicket"
  ADD CONSTRAINT "SupportTicket_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "SupportTicket_userId_idx"    ON "SupportTicket"("userId");
CREATE INDEX IF NOT EXISTS "SupportTicket_status_idx"    ON "SupportTicket"("status");
CREATE INDEX IF NOT EXISTS "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt");
