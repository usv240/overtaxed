// Apply a .sql file to ClickHouse Cloud over the HTTP interface.
// Usage: node scripts/apply-sql.mjs db/schema.sql
import { readFileSync } from "node:fs";
import process from "node:process";

// minimal .env loader (no dep)
try {
  for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const HOST = process.env.CLICKHOUSE_HOST;
const USER = process.env.CLICKHOUSE_USER ?? "default";
const PASS = process.env.CLICKHOUSE_PASSWORD ?? "";
if (!HOST) throw new Error("CLICKHOUSE_HOST missing");

const file = process.argv[2];
if (!file) throw new Error("usage: node scripts/apply-sql.mjs <file.sql>");

// split on ';' at end of line, drop comments/blanks
const sql = readFileSync(file, "utf8")
  .split("\n")
  .filter((l) => !l.trim().startsWith("--"))
  .join("\n");
const statements = sql.split(/;\s*$/m).map((s) => s.trim()).filter(Boolean);

const auth = "Basic " + Buffer.from(`${USER}:${PASS}`).toString("base64");

for (const stmt of statements) {
  const res = await fetch(HOST, {
    method: "POST",
    headers: { Authorization: auth, "Content-Type": "text/plain" },
    body: stmt,
  });
  const text = await res.text();
  const label = stmt.replace(/\s+/g, " ").slice(0, 70);
  if (!res.ok) {
    console.error(`✗ ${label}\n  ${text}`);
    process.exit(1);
  }
  console.log(`✓ ${label}${text.trim() ? "  → " + text.trim().slice(0, 60) : ""}`);
}
console.log(`\nApplied ${statements.length} statement(s) from ${file}.`);
