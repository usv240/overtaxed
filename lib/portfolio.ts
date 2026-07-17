import { ch } from "@/lib/clickhouse";
import { pgQuery } from "@/lib/postgres";

/**
 * OLTP + OLAP integration (bonus category).
 *  - Writes (save property, file appeal, update status) → Postgres (OLTP).
 *  - Portfolio read = a SINGLE ClickHouse query that federates Postgres via the
 *    postgresql() table function and JOINs it against the ClickHouse analytical
 *    tables (OLAP). One query spans both engines.
 */

function pgSource(table: string): string {
  const host = process.env.PGHOST;
  const port = process.env.PGPORT ?? "5432";
  const db = process.env.PGDATABASE ?? "postgres";
  const user = process.env.PGUSER ?? "postgres";
  const pass = (process.env.PGPASSWORD ?? "").replace(/'/g, "\\'");
  return `postgresql('${host}:${port}', '${db}', '${table}', '${user}', '${pass}')`;
}

// ── OLTP writes ──────────────────────────────────────────────────────────────
export async function saveProperty(p: {
  country: string; pin?: string | null; address: string; region?: string | null; userId?: string;
}) {
  await pgQuery(
    `INSERT INTO saved_properties (user_id, country, pin, address, region)
     VALUES ($1,$2,$3,$4,$5)`,
    [p.userId ?? "demo", p.country, p.pin ?? null, p.address, p.region ?? null],
  );
}

export async function fileAppeal(a: {
  pin?: string | null; address: string; jurisdiction: string; estimatedAnnualSaving: number; userId?: string;
}) {
  const rows = await pgQuery<{ id: number }>(
    `INSERT INTO appeals (user_id, property_pin, address, jurisdiction, estimated_annual_saving, status)
     VALUES ($1,$2,$3,$4,$5,'filed') RETURNING id`,
    [a.userId ?? "demo", a.pin ?? null, a.address, a.jurisdiction, a.estimatedAnnualSaving],
  );
  return rows[0]?.id;
}

export async function getAppeals(userId = "demo") {
  return pgQuery<{
    id: number; address: string; jurisdiction: string; estimated_annual_saving: number;
    status: string; created_at: string;
  }>(
    `SELECT id, address, jurisdiction, estimated_annual_saving, status, created_at
     FROM appeals WHERE user_id=$1 ORDER BY created_at DESC`,
    [userId],
  );
}

// ── OLTP + OLAP federated read (the bonus money-shot) ────────────────────────
export type PortfolioRow = {
  address: string; pin: string; region: string; country: string;
  assessed: number | null; recentSale: number | null; ratio: number | null;
};

export async function getPortfolio(userId = "demo"): Promise<{ rows: PortfolioRow[]; elapsedMs: number }> {
  const started = performance.now();
  const rs = await ch().query({
    query: `
      SELECT s.address AS address, s.pin AS pin, s.region AS region, s.country AS country,
             a.assessed_value AS assessed,
             ls.sp AS recentSale,
             if(ls.sp > 0, round(a.assessed_value / ls.sp, 3), NULL) AS ratio
      FROM ${pgSource("saved_properties")} AS s
      LEFT JOIN overtaxed.assessments a ON a.pin = s.pin
      LEFT JOIN (SELECT pin, argMax(sale_price, sale_date) AS sp FROM overtaxed.sales GROUP BY pin) ls
             ON ls.pin = s.pin
      WHERE s.user_id = {uid:String}`,
    query_params: { uid: userId },
    format: "JSONEachRow",
  });
  const rows = (await rs.json()) as PortfolioRow[];
  return { rows, elapsedMs: Math.round((performance.now() - started) * 10) / 10 };
}
