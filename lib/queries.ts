import { query } from "@/lib/clickhouse";
import type {
  VerdictCard,
  StreetMap,
  RegressivityScatter,
  DistributionStrip,
  CompsTable,
} from "@/lib/viz-catalog";

/**
 * All analytics live here, as validated ClickHouse queries. Each function
 * returns both the raw numbers AND the timing, so the UI can show the
 * "⚡ N ms over M rows" badge that proves the ClickHouse speed claim.
 */

// Rough effective property-tax rates for turning over-assessment $ into annual $.
const EFFECTIVE_TAX_RATE: Record<string, number> = {
  "Cook County": 0.025,
};

export type Candidate = {
  pin: string;
  address: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
  postcode: string;
};

/** Resolve a free-text address to candidate parcels. */
export async function findProperty(q: string): Promise<{ candidates: Candidate[]; elapsedMs: number }> {
  const { rows, elapsedMs } = await query<Candidate>(
    `SELECT pin, address, country, region, lat, lng, postcode
     FROM (
       SELECT pin, address, 'US' AS country, region, lat, lng, '' AS postcode
       FROM overtaxed.assessments
       UNION ALL
       SELECT pin, address, country, region, lat, lng, postcode
       FROM overtaxed.sales
     )
     WHERE positionCaseInsensitive(address, {q:String}) > 0
     GROUP BY pin, address, country, region, lat, lng, postcode
     ORDER BY length(address) ASC
     LIMIT 8`,
    { q },
  );
  return { candidates: rows, elapsedMs };
}

type AnalyzeRow = {
  address: string;
  region: string;
  lat: number;
  lng: number;
  assessed: number;
  recent_sale: number;
  ratio: number;
  median_ratio: number;
  over_assessed_by: number;
};

/**
 * The personal verdict: is this parcel over-assessed vs comparable sales?
 * Returns a VerdictCard spec + a CompsTable spec + the raw analysis.
 */
export async function analyzeProperty(pin: string): Promise<{
  found: boolean;
  verdict?: VerdictCard;
  comps?: CompsTable;
  meta?: AnalyzeRow & { appealStrength: string; confidence: string; annualOverpay: number };
  elapsedMs: number;
}> {
  const { rows, elapsedMs } = await query<AnalyzeRow>(
    `WITH latest_sales AS (
       SELECT pin, argMax(sale_price, sale_date) AS sp
       FROM overtaxed.sales GROUP BY pin
     ),
     nbhd AS (
       SELECT quantileExact(0.5)(a.assessed_value / ls.sp) AS median_ratio
       FROM overtaxed.assessments a INNER JOIN latest_sales ls USING (pin)
       WHERE a.region = (SELECT region FROM overtaxed.assessments WHERE pin = {pin:String} LIMIT 1)
     )
     SELECT
       a.address                                   AS address,
       a.region                                    AS region,
       a.lat                                        AS lat,
       a.lng                                        AS lng,
       a.assessed_value                            AS assessed,
       ls.sp                                        AS recent_sale,
       round(a.assessed_value / ls.sp, 4)          AS ratio,
       round((SELECT median_ratio FROM nbhd), 4)   AS median_ratio,
       toInt64(a.assessed_value - ls.sp)           AS over_assessed_by
     FROM overtaxed.assessments a
     INNER JOIN latest_sales ls USING (pin)
     WHERE a.pin = {pin:String}
     LIMIT 1`,
    { pin },
  );

  if (!rows.length) return { found: false, elapsedMs };
  const r = rows[0];

  const rate = EFFECTIVE_TAX_RATE[r.region] ?? 0.02;
  // Over-assessment relative to what a FAIR (median-ratio) assessment would be.
  const fairAssessed = r.recent_sale * r.median_ratio;
  const excessAssessed = Math.max(0, r.assessed - fairAssessed);
  const annualOverpay = Math.round(excessAssessed * rate);

  const overPct = r.ratio / r.median_ratio - 1;
  const appealStrength =
    overPct > 0.1 ? "strong" : overPct > 0.05 ? "moderate" : overPct > 0.02 ? "weak" : "none";

  const { rows: compRows } = await query<{
    address: string; salePrice: number; saleDate: string; distanceMi: number;
  }>(
    `SELECT address,
            sale_price                                        AS salePrice,
            toString(sale_date)                               AS saleDate,
            round(geoDistance({lng:Float64},{lat:Float64}, lng, lat)/1609.34, 3) AS distanceMi
     FROM overtaxed.sales
     WHERE region = {region:String} AND pin != {pin:String}
     ORDER BY distanceMi ASC
     LIMIT 6`,
    { lng: r.lng, lat: r.lat, region: r.region, pin },
  );

  const verdict: VerdictCard = {
    kind: "verdictCard",
    headline:
      annualOverpay > 0
        ? `You're overpaying ~$${annualOverpay.toLocaleString("en-US")}/yr`
        : `Your assessment looks fair`,
    overpaymentPerPeriod: annualOverpay,
    period: "year",
    currency: "USD",
    confidence: compRows.length >= 4 ? "high" : compRows.length >= 2 ? "medium" : "low",
    appealStrength: appealStrength as VerdictCard["appealStrength"],
    subtitle: `Assessed $${r.assessed.toLocaleString("en-US")} vs recent sale $${r.recent_sale.toLocaleString("en-US")} (ratio ${r.ratio.toFixed(2)} vs neighbourhood median ${r.median_ratio.toFixed(2)}).`,
  };

  const comps: CompsTable = {
    kind: "compsTable",
    subjectAddress: r.address,
    fairValueEstimate: Math.round(fairAssessed),
    comps: compRows,
  };

  return {
    found: true,
    verdict,
    comps,
    meta: { ...r, appealStrength, confidence: verdict.confidence, annualOverpay },
    elapsedMs,
  };
}

/** THE INNOVATION: regressivity (PRD/COD) + scatter points for a region. */
export async function getRegressivity(region: string): Promise<{ spec: RegressivityScatter; elapsedMs: number; rowsRead: number }> {
  const { rows, elapsedMs } = await query<{
    salePrice: number; ratio: number;
  }>(
    `SELECT ls.sp AS salePrice, round(a.assessed_value / ls.sp, 4) AS ratio
     FROM overtaxed.assessments a
     INNER JOIN (SELECT pin, argMax(sale_price, sale_date) AS sp FROM overtaxed.sales GROUP BY pin) ls USING (pin)
     WHERE a.region = {region:String}
     ORDER BY salePrice ASC`,
    { region },
  );

  const { rows: stat } = await query<{ prd: number; cod: number }>(
    `WITH ratios AS (
       SELECT a.assessed_value AS av, ls.sp AS sp, a.assessed_value/ls.sp AS ratio
       FROM overtaxed.assessments a
       INNER JOIN (SELECT pin, argMax(sale_price, sale_date) AS sp FROM overtaxed.sales GROUP BY pin) ls USING (pin)
       WHERE a.region = {region:String}
     )
     SELECT round(avg(ratio)/(sum(av)/sum(sp)),4) AS prd,
            round(100*avg(abs(ratio - med.m))/any(med.m),2) AS cod
     FROM ratios CROSS JOIN (SELECT quantileExact(0.5)(ratio) AS m FROM ratios) AS med`,
    { region },
  );

  const prd = stat[0]?.prd ?? 1;
  const cod = stat[0]?.cod ?? 0;

  const spec: RegressivityScatter = {
    kind: "regressivityScatter",
    region,
    points: rows,
    prd,
    cod,
    caption:
      prd > 1.03
        ? `PRD ${prd} > 1.03 → regressive: cheaper homes are over-assessed relative to expensive ones.`
        : `PRD ${prd} → within the fair range.`,
  };
  return { spec, elapsedMs, rowsRead: rows.length };
}

/** Street map: subject + neighbours coloured by assessment ratio. */
export async function getStreetMap(pin: string): Promise<{ spec: StreetMap | null; elapsedMs: number }> {
  const { rows, elapsedMs } = await query<{
    address: string; lat: number; lng: number; ratio: number | null;
    salePrice: number | null; assessedValue: number | null; isSubject: number;
  }>(
    `WITH latest_sales AS (SELECT pin, argMax(sale_price, sale_date) AS sp FROM overtaxed.sales GROUP BY pin),
     subj AS (SELECT region, lat, lng FROM overtaxed.assessments WHERE pin = {pin:String} LIMIT 1)
     SELECT a.address AS address, a.lat AS lat, a.lng AS lng,
            round(a.assessed_value / ls.sp, 4) AS ratio,
            ls.sp AS salePrice, a.assessed_value AS assessedValue,
            a.pin = {pin:String} AS isSubject
     FROM overtaxed.assessments a
     INNER JOIN latest_sales ls USING (pin)
     WHERE a.region = (SELECT region FROM subj)
       AND geoDistance((SELECT lng FROM subj),(SELECT lat FROM subj), a.lng, a.lat) < 800
     ORDER BY isSubject DESC`,
    { pin },
  );
  if (!rows.length) return { spec: null, elapsedMs };
  const subject = rows.find((x) => x.isSubject) ?? rows[0];
  const spec: StreetMap = {
    kind: "streetMap",
    center: { lat: subject.lat, lng: subject.lng },
    zoom: 16,
    subject: { ...subject, isSubject: true },
    neighbours: rows.filter((x) => !x.isSubject).map((x) => ({ ...x, isSubject: false })),
    legend: "Assessment ratio vs recent sale (red = over-assessed)",
  };
  return { spec, elapsedMs };
}
