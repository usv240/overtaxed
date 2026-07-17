import { Pool } from "pg";

/**
 * Postgres = the OLTP side (ClickHouse Cloud Postgres).
 * Holds transactional user state: saved properties and appeal status.
 * ClickHouse remains the OLAP analytical layer; the two are joined for the
 * "My Portfolio" view (the OLTP + OLAP integration — bonus category).
 */
let _pool: Pool | null = null;

export function pg(): Pool {
  if (!_pool) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 4,
    });
  }
  return _pool;
}

export async function pgQuery<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const res = await pg().query(sql, params);
  return res.rows as T[];
}
