import { createClient, type ClickHouseClient } from "@clickhouse/client";

/**
 * ClickHouse is the PRIMARY database for Overtaxed.
 * Two clients:
 *   - `ch`        : full-access client for ingestion tasks (Trigger.dev).
 *   - `chReadonly`: read-only client the agent uses for analytics queries.
 *
 * Read-only is enforced with a per-query setting so the LLM-driven agent can
 * never mutate data, even if a tool is coaxed into emitting DDL/DML.
 */

let _ch: ClickHouseClient | null = null;
let _chReadonly: ClickHouseClient | null = null;

function baseConfig() {
  const url = process.env.CLICKHOUSE_HOST;
  const username = process.env.CLICKHOUSE_USER ?? "default";
  const password = process.env.CLICKHOUSE_PASSWORD ?? "";
  const database = process.env.CLICKHOUSE_DATABASE ?? "overtaxed";
  if (!url) {
    throw new Error(
      "CLICKHOUSE_HOST is not set. Copy .env.example to .env and fill it in.",
    );
  }
  return { url, username, password, database };
}

/** Full-access client (ingestion, DDL). Use only in trusted server/task code. */
export function ch(): ClickHouseClient {
  if (!_ch) _ch = createClient(baseConfig());
  return _ch;
}

/** Read-only client — the ONLY client the agent's query tools may use. */
export function chReadonly(): ClickHouseClient {
  if (!_chReadonly) {
    _chReadonly = createClient({
      ...baseConfig(),
      clickhouse_settings: {
        readonly: "1",
        max_execution_time: 30,
        // keep the agent honest & fast
        max_result_rows: "100000",
      },
    });
  }
  return _chReadonly;
}

/** Convenience: run a read-only SELECT and return typed rows + timing. */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: Record<string, unknown>,
): Promise<{ rows: T[]; elapsedMs: number; rowsRead?: number }> {
  const started = performance.now();
  const rs = await chReadonly().query({
    query: sql,
    query_params: params,
    format: "JSONEachRow",
  });
  const rows = (await rs.json()) as T[];
  const elapsedMs = Math.round((performance.now() - started) * 10) / 10;
  return { rows, elapsedMs };
}
