import { Pool } from "pg";

/**
 * Shared PostgreSQL connection pool.
 * All services that need raw SQL should import from here
 * instead of creating their own Pool instances.
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // For Supabase
  },
});
