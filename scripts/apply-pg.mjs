// Apply a .sql file to Postgres. Usage: node scripts/apply-pg.mjs db/postgres-schema.sql
import { readFileSync } from "node:fs";
for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const { Client } = await import("pg");
const file = process.argv[2];
if (!file) throw new Error("usage: node scripts/apply-pg.mjs <file.sql>");
const sql = readFileSync(file, "utf8");
const c = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
await c.query(sql);
const t = await c.query(
  "select table_name from information_schema.tables where table_schema='public' order by 1",
);
console.log("tables:", t.rows.map((r) => r.table_name).join(", "));
await c.end();
