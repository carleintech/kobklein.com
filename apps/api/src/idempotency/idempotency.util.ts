/**
 * Extract idempotency key from request headers or body.
 */
export function getIdempotencyKey(req: any, body?: any): string | undefined {
  return (
    req.headers?.["idempotency-key"] ||
    req.headers?.["Idempotency-Key"] ||
    body?.idempotencyKey
  );
}
