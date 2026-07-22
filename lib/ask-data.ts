import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { chReadonly } from "./clickhouse";
import type { DataResult } from "./viz-catalog";

/**
 * "Ask the data anything": turn a natural-language question into a single, safe,
 * read-only ClickHouse query, run it live, and hand back rows + a chart hint +
 * the SQL we actually ran. The client is already read-only (no writes possible);
 * we additionally reject anything that isn't a lone SELECT.
 */

const SCHEMA = `You write ClickHouse SQL over a property-tax database (database name: overtaxed).

Tables:
- overtaxed.sales(country String /* 'US' | 'UK' */, region String, pin String, address String, postcode String, sale_date Date, sale_price UInt64, lat Float64, lng Float64, prop_type String, beds Nullable(UInt8))
- overtaxed.assessments(country String, region String, pin String, tax_year UInt16, assessed_value UInt64, lat Float64, lng Float64, class String, address String)
- overtaxed.parcels(pin String, lat Float64, lng Float64, address String, zip String, class String)

Domain notes:
- US regions are exactly 'Cook County' and 'Allegheny County'. UK data has country='UK'.
- The over-assessment RATIO = assessed_value / latest_sale_price. Join assessments a to a home's latest sale: (SELECT pin, argMax(sale_price, sale_date) AS sp FROM overtaxed.sales GROUP BY pin) ls ON ls.pin = a.pin.
- Keep only sane arms-length ratios: assessed_value / sp BETWEEN 0.2 AND 3.0.
- sale_price and assessed_value are whole-currency integers.`;

const Out = z.object({
  sql: z.string().describe("ONE read-only ClickHouse SELECT (or WITH ... SELECT). No trailing semicolon."),
  caption: z.string().describe("one short, plain-English sentence describing what the result shows"),
  chart: z.object({
    type: z.enum(["bar", "line", "none"]),
    xIndex: z.number().int().describe("0-based result column for the x-axis label/category"),
    yIndex: z.number().int().describe("0-based result column for the numeric y value"),
  }),
});

const BANNED = /\b(insert|update|delete|alter|drop|create|attach|detach|truncate|rename|grant|revoke|optimize|system|kill|into\s+outfile|into\s+dumpfile)\b/i;

export async function askData(
  question: string,
): Promise<{ spec: DataResult | null; elapsedMs: number; error?: string }> {
  // 1) Ask the model for a query + chart hint.
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-5"),
    schema: Out,
    system:
      `${SCHEMA}\n\nReturn ONE read-only SELECT that answers the question. Always include an explicit LIMIT of at most 200. ` +
      `Prefer a GROUP BY aggregate that charts well. Round money to whole numbers. Never modify data. ` +
      `If a chart fits, set chart.type to 'bar' or 'line' with xIndex (category) and yIndex (number); otherwise 'none'.`,
    prompt: question,
  });

  // 2) Guardrails: must be a lone SELECT/WITH, no banned verbs, no statement chaining.
  let sql = object.sql.trim().replace(/;+\s*$/, "");
  if (!/^\s*(with|select)\b/i.test(sql) || BANNED.test(sql) || sql.includes(";")) {
    return { spec: null, elapsedMs: 0, error: "That question would need a query I can't run safely." };
  }
  if (!/\blimit\b/i.test(sql)) sql += "\nLIMIT 200";

  // 3) Execute on the read-only client (30s cap, 100k-row cap already enforced).
  const started = performance.now();
  try {
    const rs = await chReadonly().query({ query: sql, format: "JSONCompact" });
    const j = (await rs.json()) as { meta?: { name: string }[]; data?: (string | number | null)[][] };
    const elapsedMs = Math.round((performance.now() - started) * 10) / 10;
    const columns = (j.meta ?? []).map((m) => m.name);
    const rows = (j.data ?? []).slice(0, 200);
    if (!columns.length) return { spec: null, elapsedMs, error: "No results." };

    const okIdx = (i: number) => Number.isInteger(i) && i >= 0 && i < columns.length;
    const chart =
      object.chart.type !== "none" && columns.length >= 2 && rows.length > 0 && okIdx(object.chart.xIndex) && okIdx(object.chart.yIndex)
        ? { type: object.chart.type, xIndex: object.chart.xIndex, yIndex: object.chart.yIndex }
        : null;

    const spec: DataResult = { kind: "dataResult", question, sql, columns, rows, chart, caption: object.caption };
    return { spec, elapsedMs };
  } catch (e) {
    const elapsedMs = Math.round((performance.now() - started) * 10) / 10;
    return { spec: null, elapsedMs, error: e instanceof Error ? e.message : String(e) };
  }
}
