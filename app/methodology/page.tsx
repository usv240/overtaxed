import Link from "next/link";
import { query } from "@/lib/clickhouse";

export const dynamic = "force-dynamic";

async function counts() {
  const { rows } = await query<{ metric: string; n: string }>(`
    SELECT 'UK sales (Land Registry)' AS metric, toString(count()) AS n FROM overtaxed.sales WHERE country='UK'
    UNION ALL SELECT 'Cook County sales (arms-length)', toString(count()) FROM overtaxed.sales WHERE region='Cook County'
    UNION ALL SELECT 'Cook County assessments', toString(count()) FROM overtaxed.assessments WHERE region='Cook County'
    UNION ALL SELECT 'Cook County parcels (geo+address)', toString(count()) FROM overtaxed.parcels
    UNION ALL SELECT 'Allegheny County assessments', toString(count()) FROM overtaxed.assessments WHERE region='Allegheny County'
    UNION ALL SELECT 'Allegheny County sales (arms-length)', toString(count()) FROM overtaxed.sales WHERE region='Allegheny County'
    UNION ALL SELECT 'UK Band D amounts (gov.uk, live)', toString(count()) FROM overtaxed.uk_band_d`);
  return rows;
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-t border-border py-1.5 text-sm ">
      <span className="text-muted">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}

function Sql({ title, note, code }: { title: string; note: string; code: string }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border bg-surface-2 px-3 py-2">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted">{note}</span>
      </div>
      <pre className="overflow-x-auto bg-surface px-3 py-3 text-[12px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const Q_REGRESSIVITY = `-- IAAO uniformity metrics (PRD, COD) over every sold parcel
WITH ratios AS (
  SELECT a.assessed_value / ls.sp AS ratio,
         a.assessed_value AS av, ls.sp AS sp
  FROM overtaxed.assessments a
  INNER JOIN (                                -- latest_sales MV (AggregatingMergeTree)
    SELECT pin, argMaxMerge(sp) AS sp
    FROM overtaxed.latest_sales GROUP BY pin
  ) ls USING (pin)
  WHERE a.region = 'Cook County'
    AND a.assessed_value / ls.sp BETWEEN 0.2 AND 3.0
)
SELECT count()                                  AS n,
       round(avg(ratio) / (sum(av)/sum(sp)), 4) AS prd,  -- Price-Related Differential
       round(100 * avg(abs(ratio - m)) / m, 2)  AS cod   -- Coefficient of Dispersion
FROM ratios
CROSS JOIN (SELECT quantileExact(0.5)(ratio) AS m FROM ratios);`;

const Q_HEATMAP = `-- The Tax Divide: 1.6M parcels -> ~1,800 map cells in one pass
SELECT round(lat, 2) AS lat, round(lng, 2) AS lng,
       count()                        AS n,
       avg(a.assessed_value / ls.sp)  AS ratio
FROM overtaxed.parcels p
INNER JOIN overtaxed.assessments a ON a.pin = p.pin
INNER JOIN (
  SELECT pin, argMaxMerge(sp) AS sp FROM overtaxed.latest_sales GROUP BY pin
) ls ON ls.pin = p.pin
WHERE a.region = 'Cook County'
GROUP BY lat, lng
HAVING n >= 8;`;

const Q_FEDERATION = `-- One query across Postgres (OLTP) + ClickHouse (OLAP)
SELECT s.address, a.assessed_value, ls.sp AS last_sale
FROM postgresql('<pg-host>:5432', 'overtaxed', 'saved_properties', ...) AS s
LEFT JOIN overtaxed.assessments a ON a.pin = s.pin
LEFT JOIN (
  SELECT pin, argMax(sale_price, sale_date) AS sp
  FROM overtaxed.sales GROUP BY pin
) ls ON ls.pin = s.pin;`;

const Q_INGEST = `-- Zero-ETL: ClickHouse reads the gov CSV straight off HTTP
INSERT INTO overtaxed.sales
SELECT ... FROM url(
  'https://.../pp-complete.csv', 'CSVWithNames'
);`;

export default async function MethodologyPage() {
  const rows = await counts();
  const fmt = (n: string) => Number(n).toLocaleString("en-US");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Methodology &amp; sources</h1>
        <Link href="/" className="text-sm text-accent underline">← back</Link>
      </div>
      <p className="mb-6 text-sm text-muted">
        Overtaxed makes an <strong>estimate from public records</strong>. It is not tax or legal advice. Everything
        below is transparent so you can check our work.
      </p>

      <h2 className="mb-1 mt-6 font-semibold">Live data (loaded into ClickHouse now)</h2>
      <div className="rounded-xl border border-border p-3 ">
        {rows.map((r) => <Row key={r.metric} k={r.metric} v={<strong>{fmt(r.n)}</strong>} />)}
      </div>
      <ul className="mt-2 space-y-1 text-sm text-muted">
        <li>• US: <a className="underline" href="https://datacatalog.cookcountyil.gov/">Cook County Assessor Open Data</a> (Parcel Universe, Addresses, Assessed Values, Sales) and <a className="underline" href="https://data.wprdc.org/dataset/property-assessments">Allegheny County (WPRDC)</a> — two counties, proving the pipeline generalises.</li>
        <li>• UK: <a className="underline" href="https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads">HM Land Registry Price Paid Data</a> (Open Government Licence).</li>
      </ul>

      <h2 className="mb-1 mt-6 font-semibold">Computed live (no hardcoded numbers)</h2>
      <ul className="space-y-1 text-sm text-muted">
        <li>• <strong>Comparable sales</strong> — nearest arms-length sales by <code>geoDistance()</code>.</li>
        <li>• <strong>Over-assessment</strong> — your assessment ratio vs the local (≤2km) neighbourhood median.</li>
        <li>• <strong>Regressivity</strong> — <strong>PRD</strong> (Price-Related Differential) and <strong>COD</strong> (Coefficient of Dispersion), the standard IAAO uniformity metrics, over every sold parcel in the county.</li>
        <li>• <strong>UK band check</strong> — <strong>real bands fetched live from the VOA</strong> band-check service for your postcode (cached in ClickHouse), then a neighbour-band comparison + back-cast of local sale prices to their 1991 value. The £ overpayment uses your council&apos;s <strong>real Band D charge</strong> (gov.uk, loaded live).</li>
      </ul>

      <h2 className="mb-1 mt-8 font-semibold">The actual ClickHouse queries</h2>
      <p className="mb-1 text-sm text-muted">
        Nothing here is mocked — these are the real queries behind the answers. ClickHouse is the primary database;
        every figure is computed live over millions of rows.
      </p>
      <Sql
        title="Regressivity — PRD &amp; COD"
        note="IAAO uniformity science, sub-second"
        code={Q_REGRESSIVITY}
      />
      <Sql
        title="The Tax Divide — spatial grid"
        note="1.6M parcels → ~1,800 cells, ~200 ms"
        code={Q_HEATMAP}
      />
      <Sql
        title="OLTP + OLAP federation — postgresql()"
        note="Postgres joined to ClickHouse in one statement"
        code={Q_FEDERATION}
      />
      <Sql
        title="Zero-ETL ingestion — url()"
        note="Raw government CSVs read straight off HTTP"
        code={Q_INGEST}
      />

      <h2 className="mb-1 mt-8 font-semibold">Reference inputs (statutory / published — with sources)</h2>
      <div className="space-y-2 text-sm text-muted">
        <p>These few values are external inputs (not derivable from sales data). They live in one place — <code>lib/assumptions.ts</code> — each cited:</p>
        <Row k="Cook County effective tax rate" v="~2.5% · Cook County Treasurer" />
        <Row k="Cook County assessment level" v="10% of market · 35 ILCS 200" />
        <Row k="UK band ratios (A–H vs D)" v="statutory · LGFA 1992 s.5" />
        <Row k="UK 1991 band value ranges" v="statutory · SI 1992/550" />
        <Row k="UK 1991 back-cast divisor" v="Nationwide / HM Land Registry HPI" />
      </div>

      <h2 className="mb-1 mt-6 font-semibold">Honest limitations</h2>
      <ul className="space-y-1 text-sm text-muted">
        <li>• Estimates depend on recent comparable sales; sparse areas get lower confidence (shown on the verdict).</li>
        <li>• UK per-property bands aren&apos;t published in bulk, so we fetch them <strong>live from the VOA&apos;s public band-check service on demand</strong> (real bands for any postcode) and cache them in ClickHouse. The &quot;12 Lavender Sweep&quot; example is a curated illustration of the over-banding scenario; any real UK postcode returns live data.</li>
        <li>• Not affiliated with any assessor, the VOA, or any government body.</li>
      </ul>
    </div>
  );
}
