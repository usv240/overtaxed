import Link from "next/link";
import { query } from "@/lib/clickhouse";

export const dynamic = "force-dynamic";

async function counts() {
  const { rows } = await query<{ metric: string; n: string }>(`
    SELECT 'UK sales (Land Registry)' AS metric, toString(count()) AS n FROM overtaxed.sales WHERE country='UK'
    UNION ALL SELECT 'Cook County sales (arms-length)', toString(count()) FROM overtaxed.sales WHERE region='Cook County'
    UNION ALL SELECT 'Cook County assessments', toString(count()) FROM overtaxed.assessments WHERE region='Cook County'
    UNION ALL SELECT 'Cook County parcels (geo+address)', toString(count()) FROM overtaxed.parcels`);
  return rows;
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-t border-black/5 py-1.5 text-sm dark:border-white/5">
      <span className="text-neutral-500">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}

export default async function MethodologyPage() {
  const rows = await counts();
  const fmt = (n: string) => Number(n).toLocaleString("en-US");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Methodology &amp; sources</h1>
        <Link href="/" className="text-sm text-blue-600 underline">← back</Link>
      </div>
      <p className="mb-6 text-sm text-neutral-600 dark:text-neutral-300">
        Overtaxed makes an <strong>estimate from public records</strong>. It is not tax or legal advice. Everything
        below is transparent so you can check our work.
      </p>

      <h2 className="mb-1 mt-6 font-semibold">Live data (loaded into ClickHouse now)</h2>
      <div className="rounded-xl border border-black/10 p-3 dark:border-white/10">
        {rows.map((r) => <Row key={r.metric} k={r.metric} v={<strong>{fmt(r.n)}</strong>} />)}
      </div>
      <ul className="mt-2 space-y-1 text-sm text-neutral-500">
        <li>• US: <a className="underline" href="https://datacatalog.cookcountyil.gov/">Cook County Assessor Open Data</a> — Parcel Universe (geo), Parcel Addresses, Assessed Values, Parcel Sales.</li>
        <li>• UK: <a className="underline" href="https://www.gov.uk/government/statistical-data-sets/price-paid-data-downloads">HM Land Registry Price Paid Data</a> (Open Government Licence).</li>
      </ul>

      <h2 className="mb-1 mt-6 font-semibold">Computed live (no hardcoded numbers)</h2>
      <ul className="space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
        <li>• <strong>Comparable sales</strong> — nearest arms-length sales by <code>geoDistance()</code>.</li>
        <li>• <strong>Over-assessment</strong> — your assessment ratio vs the local (≤2km) neighbourhood median.</li>
        <li>• <strong>Regressivity</strong> — <strong>PRD</strong> (Price-Related Differential) and <strong>COD</strong> (Coefficient of Dispersion), the standard IAAO uniformity metrics, over every sold parcel in the county.</li>
        <li>• <strong>UK band check</strong> — neighbour-band comparison + back-cast of your sale price to its 1991 value.</li>
      </ul>

      <h2 className="mb-1 mt-6 font-semibold">Reference inputs (statutory / published — with sources)</h2>
      <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
        <p>These few values are external inputs (not derivable from sales data). They live in one place — <code>lib/assumptions.ts</code> — each cited:</p>
        <Row k="Cook County effective tax rate" v="~2.5% · Cook County Treasurer" />
        <Row k="Cook County assessment level" v="10% of market · 35 ILCS 200" />
        <Row k="UK band ratios (A–H vs D)" v="statutory · LGFA 1992 s.5" />
        <Row k="UK 1991 band value ranges" v="statutory · SI 1992/550" />
        <Row k="UK Band D charge (by council)" v="gov.uk council-tax levels" />
        <Row k="UK 1991 back-cast divisor" v="Nationwide / HM Land Registry HPI" />
      </div>

      <h2 className="mb-1 mt-6 font-semibold">Honest limitations</h2>
      <ul className="space-y-1 text-sm text-neutral-500">
        <li>• Estimates depend on recent comparable sales; sparse areas get lower confidence (shown on the verdict).</li>
        <li>• UK per-property council-tax bands are not published in bulk (VOA restriction). We demonstrate the neighbour-comparison method on a curated block; production uses an on-demand VOA lookup (a Trigger.dev task).</li>
        <li>• Not affiliated with any assessor, the VOA, or any government body.</li>
      </ul>
    </div>
  );
}
