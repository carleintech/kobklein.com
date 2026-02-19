import { Pool } from "pg";

/**
 * Shared PostgreSQL connection pool.
 * All services that need raw SQL should import from here
 * instead of creating their own Pool instances.
 *
 * Lazy-initialized via Proxy so the app starts even without DATABASE_URL.
 */
let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set");
    _pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false, // For Supabase
      },
    });
  }
  return _pool;
}

export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    return (getPool() as any)[prop];
  },
});
