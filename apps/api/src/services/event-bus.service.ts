import { pool } from "../db/pool";

export async function emitEvent(name: string, payload: any) {
  return pool.query(`
    INSERT INTO "DomainEvent" ("id", "name", "payload", "createdAt", "status")
    VALUES (gen_random_uuid(), $1, $2, now(), $3)
  `, [name, JSON.stringify(payload), "queued"]);
}

/**
 * Simple event worker: fetch queued events and handle them.
 * In production we can replace this with BullMQ, SQS, Kafka, etc.
 */
export async function pullQueuedEvents(take = 25) {
  const result = await pool.query(`
    SELECT * FROM "DomainEvent"
    WHERE status = $1
    ORDER BY "createdAt" ASC
    LIMIT $2
  `, ["queued", take]);
  return result.rows;
}

export async function markEventHandled(id: string) {
  return pool.query(`
    UPDATE "DomainEvent"
    SET status = $1, "handledAt" = now(), error = $2
    WHERE id = $3
  `, ["handled", null, id]);
}

export async function markEventFailed(id: string, error: string) {
  return pool.query(`
    UPDATE "DomainEvent"
    SET status = $1, error = $2
    WHERE id = $3
  `, ["failed", error, id]);
}
