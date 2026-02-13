-- NotificationLog table for tracking all SMS/email/push delivery status
CREATE TABLE IF NOT EXISTS "NotificationLog" (
  "id"        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "channel"   TEXT NOT NULL DEFAULT 'sms',       -- sms, email, push
  "type"      TEXT NOT NULL,                       -- withdrawal.ready, deposit.success, etc.
  "to"        TEXT NOT NULL,                       -- phone number / email
  "body"      TEXT NOT NULL,
  "status"    TEXT NOT NULL DEFAULT 'queued',      -- queued, sent, failed
  "error"     TEXT,
  "jobId"     TEXT,                                -- BullMQ job ID
  "userId"    TEXT,                                -- optional FK to User
  "attempts"  INT NOT NULL DEFAULT 0,
  "sentAt"    TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_notification_log_status" ON "NotificationLog" ("status");
CREATE INDEX IF NOT EXISTS "idx_notification_log_created" ON "NotificationLog" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_notification_log_to" ON "NotificationLog" ("to");
