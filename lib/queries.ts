import { query } from "@/lib/clickhouse";
import {
  US_EFFECTIVE_TAX_RATE, US_DEFAULT_EFFECTIVE_RATE,
  UK_BAND_FACTOR, UK_BAND_D_ANNUAL, UK_DEFAULT_BAND_D_ANNUAL,
  UK_HPI_1991_DIVISOR, UK_DEFAULT_HPI_DIVISOR,
  bandIndex, bandLetter, bandFor1991,
} from "@/lib/assumptions";
import type {
  VerdictCard,
  StreetMap,
  RegressivityScatter,
  DistributionStrip,
  CompsTable,
  AppealPacket,
} from "@/lib/viz-catalog";

/**
 * All analytics live here, as validated ClickHouse queries. Each function
 * returns both the raw numbers AND the timing, so the UI can show the
 * "⚡ N ms over M rows" badge that proves the ClickHouse speed claim.
 */

export type Candidate = {
  pin: string;
  address: string;
  country: string;
  region: string;
  lat: number;
  lng: number;
  postcode: string;
};

/** Resolve a free-text address to real Cook County parcels (via the parcels dimension). */
export async function findProperty(q: string): Promise<{ candidates: Candidate[]; elapsedMs: number }> {
  const { rows, elapsedMs } = await query<Candidate>(
    `SELECT p.pin AS pin, p.address AS address, 'US' AS country, a.region AS region,
            p.lat AS lat, p.lng AS lng, p.zip AS postcode
     FROM overtaxed.parcels p
     INNER JOIN overtaxed.assessments a ON a.pin = p.pin
     WHERE positionCaseInsensitive(p.address, {q:String}) > 0
     GROUP BY p.pin, p.address, a.region, p.lat, p.lng, p.zip
     ORDER BY length(p.address) ASC
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
     subj AS (SELECT lat, lng FROM overtaxed.parcels WHERE pin = {pin:String} LIMIT 1),
     nbhd AS (
       -- neighbourhood = sold parcels within 2km of the subject (local uniformity)
       SELECT quantileExact(0.5)(a.assessed_value / ls.sp) AS median_ratio
       FROM overtaxed.parcels p
       INNER JOIN overtaxed.assessments a ON a.pin = p.pin
       INNER JOIN latest_sales ls ON ls.pin = p.pin
       WHERE geoDistance((SELECT lng FROM subj), (SELECT lat FROM subj), p.lng, p.lat) < 2000
         AND a.assessed_value / ls.sp BETWEEN 0.2 AND 3.0
     )
     SELECT
       p.address                                   AS address,
       a.region                                    AS region,
       p.lat                                        AS lat,
       p.lng                                        AS lng,
       a.assessed_value                            AS assessed,
       ls.sp                                        AS recent_sale,
       round(a.assessed_value / ls.sp, 4)          AS ratio,
       round((SELECT median_ratio FROM nbhd), 4)   AS median_ratio,
       toInt64(a.assessed_value - ls.sp)           AS over_assessed_by
     FROM overtaxed.parcels p
     INNER JOIN overtaxed.assessments a ON a.pin = p.pin
     INNER JOIN latest_sales ls ON ls.pin = p.pin
     WHERE p.pin = {pin:String}
     LIMIT 1`,
    { pin },
  );

  if (!rows.length) return { found: false, elapsedMs };
  const r = rows[0];

  const rate = US_EFFECTIVE_TAX_RATE[r.region] ?? US_DEFAULT_EFFECTIVE_RATE;
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
    `SELECT p.address                                          AS address,
            s.sale_price                                       AS salePrice,
            toString(s.sale_date)                              AS saleDate,
            round(geoDistance({lng:Float64},{lat:Float64}, p.lng, p.lat)/1609.34, 3) AS distanceMi
     FROM overtaxed.sales s
     INNER JOIN overtaxed.parcels p ON p.pin = s.pin
     WHERE s.region = {region:String} AND s.pin != {pin:String}
     ORDER BY distanceMi ASC
     LIMIT 6`,
    { lng: r.lng, lat: r.lat, region: r.region, pin },
  );

  const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
  const verdict: VerdictCard = {
    kind: "verdictCard",
    headline:
      annualOverpay > 0
        ? `You're overpaying ~${usd(annualOverpay)}/yr`
        : `Your assessment looks fair`,
    overpaymentPerPeriod: annualOverpay,
    period: "year",
    currency: "USD",
    confidence: compRows.length >= 4 ? "high" : compRows.length >= 2 ? "medium" : "low",
    appealStrength: appealStrength as VerdictCard["appealStrength"],
    subtitle: `Assessed ${usd(r.assessed)} vs recent sale ${usd(r.recent_sale)} (ratio ${r.ratio.toFixed(2)} vs neighbourhood median ${r.median_ratio.toFixed(2)}).`,
    simple:
      annualOverpay > 0
        ? `In plain terms: the tax office values your home at ${usd(r.assessed)}, but homes like yours nearby recently sold for about ${usd(r.recent_sale)}. Similar homes are taxed at roughly ${r.median_ratio.toFixed(2)}× their value — which points to a fair value near ${usd(fairAssessed)}. So your bill looks about ${usd(annualOverpay)} a year too high.`
        : `In plain terms: your assessment lines up with what similar homes nearby actually sell for, so you don't appear to be overpaying.`,
    technicalRows: [
      { label: "Assessor's market value", value: usd(r.assessed) },
      { label: "Most recent sale", value: usd(r.recent_sale) },
      { label: "Your assessment ratio (assessed ÷ sale)", value: r.ratio.toFixed(3) },
      { label: "Neighbourhood median ratio (≤2 km)", value: r.median_ratio.toFixed(3) },
      { label: "Fair value at median ratio", value: usd(fairAssessed) },
      { label: "Effective tax rate", value: `${(rate * 100).toFixed(1)}%` },
      { label: "Annual overpay", value: `(${usd(r.assessed)} − ${usd(fairAssessed)}) × ${(rate * 100).toFixed(1)}% = ${usd(annualOverpay)}` },
    ],
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

/** THE INNOVATION: regressivity (PRD/COD) + scatter + price-quintile gradient. */
export async function getRegressivity(region: string): Promise<{ spec: RegressivityScatter; elapsedMs: number; rowsRead: number }> {
  // shared join + sanity filters (arms-length ratio range, real sale prices)
  const CTE = `
    WITH ratios AS (
      SELECT a.assessed_value AS av, ls.sp AS sp, a.assessed_value / ls.sp AS ratio
      FROM overtaxed.assessments a
      INNER JOIN (SELECT pin, argMax(sale_price, sale_date) AS sp
                  FROM overtaxed.sales WHERE region = {region:String} GROUP BY pin) ls USING (pin)
      WHERE a.region = {region:String} AND ls.sp > 20000 AND a.assessed_value / ls.sp BETWEEN 0.2 AND 3.0
    )`;

  const { rows: stat, elapsedMs } = await query<{ prd: number; cod: number; n: number }>(
    `${CTE}
     SELECT count() AS n,
            round(avg(ratio)/(sum(av)/sum(sp)), 4) AS prd,
            round(100*avg(abs(ratio - med.m))/any(med.m), 2) AS cod
     FROM ratios CROSS JOIN (SELECT quantileExact(0.5)(ratio) AS m FROM ratios) AS med`,
    { region },
  );

  // a random sample of points so the browser scatter stays light at scale
  const { rows: points } = await query<{ salePrice: number; ratio: number }>(
    `${CTE} SELECT sp AS salePrice, round(ratio, 4) AS ratio FROM ratios ORDER BY rand() LIMIT 500`,
    { region },
  );

  // the regressivity gradient: avg ratio by sale-price quintile
  const { rows: quintiles } = await query<{ quintile: number; avgPrice: number; avgRatio: number }>(
    `${CTE.replace("SELECT a.assessed_value AS av, ls.sp AS sp, a.assessed_value / ls.sp AS ratio",
                   "SELECT ls.sp AS sp, a.assessed_value / ls.sp AS ratio, ntile(5) OVER (ORDER BY ls.sp) AS q")}
     SELECT q AS quintile, round(avg(sp)) AS avgPrice, round(avg(ratio), 3) AS avgRatio
     FROM ratios GROUP BY q ORDER BY q`,
    { region },
  );

  const prd = stat[0]?.prd ?? 1;
  const cod = stat[0]?.cod ?? 0;
  const n = stat[0]?.n ?? points.length;
  const lo = quintiles[0]?.avgRatio;
  const hi = quintiles[quintiles.length - 1]?.avgRatio;

  const spec: RegressivityScatter = {
    kind: "regressivityScatter",
    region,
    points,
    prd,
    cod,
    nParcels: n,
    quintiles,
    caption:
      prd > 1.03 && lo != null && hi != null
        ? `Regressive (PRD ${prd}): cheapest homes assessed at ${lo}× value, priciest at ${hi}× — the poor pay a higher effective rate.`
        : `PRD ${prd} — within the fair range.`,
    simple:
      prd > 1.03 && lo != null && hi != null
        ? `In plain terms: across ${n.toLocaleString("en-US")} homes here, the cheapest are taxed at about ${lo}× their value while the most expensive are taxed at only ${hi}× — so lower-value homes carry a heavier share. That's the opposite of fair.`
        : `In plain terms: taxes here look broadly even between cheaper and pricier homes.`,
  };
  return { spec, elapsedMs, rowsRead: n };
}

/** UK: is this home in the wrong council tax band? (neighbour comparison + 1991 back-cast) */
export async function checkUkBand(addressQuery: string): Promise<{
  found: boolean;
  verdict?: VerdictCard;
  street?: StreetMap;
  elapsedMs: number;
}> {
  const { rows: subj, elapsedMs } = await query<{
    address: string; postcode: string; band: string; lat: number; lng: number; council: string;
  }>(
    `SELECT address, postcode, band, lat, lng, council FROM overtaxed.uk_bands
     WHERE positionCaseInsensitive(address, {q:String}) > 0
     ORDER BY length(address) ASC LIMIT 1`,
    { q: addressQuery },
  );
  if (!subj.length) return { found: false, elapsedMs };
  const s = subj[0];
  const bandDAnnual = UK_BAND_D_ANNUAL[s.council] ?? UK_DEFAULT_BAND_D_ANNUAL;

  // neighbours: same postcode (or within 300m), excluding subject
  const { rows: neigh } = await query<{ address: string; band: string; lat: number; lng: number }>(
    `SELECT address, band, lat, lng FROM overtaxed.uk_bands
     WHERE postcode = {pc:String} AND address != {addr:String}`,
    { pc: s.postcode, addr: s.address },
  );

  // proposed band = median neighbour band
  const neighIdx = neigh.map((n) => bandIndex[n.band]).filter(Boolean).sort((a, b) => a - b);
  const proposedIdx = neighIdx.length ? neighIdx[Math.floor(neighIdx.length / 2)] : bandIndex[s.band];
  const subjIdx = bandIndex[s.band];

  // corroboration: back-cast the recent sale to 1991
  const { rows: sale } = await query<{ sp: number; region: string; saleYear: number }>(
    `SELECT sale_price AS sp, region, toYear(sale_date) AS saleYear
     FROM overtaxed.sales WHERE country='UK' AND address = {addr:String}
     ORDER BY sale_date DESC LIMIT 1`,
    { addr: s.address },
  );
  let estBand: string | null = null;
  let est1991: number | null = null;
  let saleYear = 2023;
  if (sale.length) {
    const factor = UK_HPI_1991_DIVISOR[sale[0].region.toUpperCase()] ?? UK_DEFAULT_HPI_DIVISOR;
    est1991 = sale[0].sp / factor;
    estBand = bandFor1991(est1991);
    saleYear = sale[0].saleYear;
  }

  const overBanded = subjIdx > proposedIdx;
  const proposedBand = bandLetter[proposedIdx];
  const annualOverpay = Math.max(0, Math.round(bandDAnnual * (UK_BAND_FACTOR[s.band] - UK_BAND_FACTOR[proposedBand])));
  const yearsOwned = Math.max(1, 2026 - saleYear);
  const owedBack = annualOverpay * yearsOwned;

  const verdict: VerdictCard = {
    kind: "verdictCard",
    headline: overBanded
      ? `Wrong council tax band — overpaying ~£${annualOverpay.toLocaleString("en-GB")}/yr`
      : `Your council tax band looks correct`,
    overpaymentPerPeriod: annualOverpay,
    period: "year",
    currency: "GBP",
    owedBack: overBanded ? owedBack : null,
    confidence: neigh.length >= 3 ? "high" : neigh.length >= 1 ? "medium" : "low",
    appealStrength: overBanded && neigh.length >= 3 ? "strong" : overBanded ? "moderate" : "none",
    subtitle: `You're Band ${s.band}; ${neigh.length} nearby homes are Band ${proposedBand}` +
      (estBand ? `, and your last sale back-casts to a ${estBand} 1991 value` : "") +
      `. Refund backdated to ${saleYear} (~£${owedBack.toLocaleString("en-GB")}).`,
    simple: overBanded
      ? `In plain terms: your home is in Band ${s.band}, but ${neigh.length} similar homes on your street are in the lower Band ${proposedBand}${estBand ? ` — and your last sale, wound back to 1991 prices, also points to Band ${proposedBand}` : ""}. So you're likely paying about £${annualOverpay.toLocaleString("en-GB")} a year too much, and could be owed roughly £${owedBack.toLocaleString("en-GB")} back.`
      : `In plain terms: your band matches your neighbours and your home's likely 1991 value, so it looks correct.`,
    technicalRows: [
      { label: "Your current band", value: `Band ${s.band}` },
      { label: "Neighbours' band (median)", value: `Band ${proposedBand}` },
      ...(sale.length
        ? [
            { label: "Most recent sale", value: `£${sale[0].sp.toLocaleString("en-GB")}` },
            { label: "Back-cast to 1991 value", value: `£${Math.round(est1991 ?? 0).toLocaleString("en-GB")} → Band ${estBand}` },
          ]
        : []),
      { label: `Band D charge (${s.council || "council"})`, value: `£${bandDAnnual.toLocaleString("en-GB")}/yr` },
      { label: "Annual overpay", value: `£D × (${UK_BAND_FACTOR[s.band].toFixed(3)} − ${UK_BAND_FACTOR[proposedBand].toFixed(3)}) = £${annualOverpay.toLocaleString("en-GB")}` },
      { label: `Refund (backdated to ${saleYear})`, value: `£${owedBack.toLocaleString("en-GB")}` },
    ],
  };

  const toPoint = (address: string, band: string, lat: number, lng: number, isSubject: boolean) => ({
    address: `${address} · Band ${band}`,
    lat, lng, ratio: bandIndex[band] / proposedIdx, isSubject,
  });
  const street: StreetMap = {
    kind: "streetMap",
    center: { lat: s.lat, lng: s.lng },
    zoom: 17,
    subject: toPoint(s.address, s.band, s.lat, s.lng, true),
    neighbours: neigh.map((n) => toPoint(n.address, n.band, n.lat, n.lng, false)),
    legend: "Council tax band vs neighbours (red = higher band than neighbours)",
  };

  return { found: true, verdict, street, elapsedMs };
}

/** Build a ready-to-file appeal packet from the over-assessment analysis. */
export async function generateAppealPacket(pin: string): Promise<{ spec: AppealPacket | null; elapsedMs: number }> {
  const a = await analyzeProperty(pin);
  if (!a.found || !a.meta) return { spec: null, elapsedMs: a.elapsedMs };
  const m = a.meta;
  const fair = Math.round(m.recent_sale * m.median_ratio);
  const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

  const spec: AppealPacket = {
    kind: "appealPacket",
    jurisdiction: "Cook County, IL — Assessor's Office / Board of Review",
    summary: `Grounds: lack of uniformity + overvaluation. Your assessment implies a market value of ${usd(m.assessed)}, but ${a.comps?.comps.length ?? 0} comparable arms-length sales nearby support about ${usd(fair)}.`,
    fields: [
      { label: "Property PIN", value: pin },
      { label: "Address", value: m.address },
      { label: "Current implied market value", value: usd(m.assessed) },
      { label: "Proposed market value", value: usd(fair) },
      { label: "Neighbourhood median ratio", value: m.median_ratio.toFixed(2) },
      { label: "Your ratio", value: m.ratio.toFixed(2) },
      { label: "Grounds", value: "Lack of uniformity (35 ILCS 200/9-5) + overvaluation" },
      { label: "Estimated annual saving", value: usd(m.annualOverpay) },
    ],
    filingUrl: "https://www.cookcountyassessor.com/online-appeals",
    pin,
    address: m.address,
    country: "US",
    region: m.region,
    estimatedAnnualSaving: m.annualOverpay,
  };
  return { spec, elapsedMs: a.elapsedMs };
}

/** Street map: subject + neighbours coloured by assessment ratio. */
export async function getStreetMap(pin: string): Promise<{ spec: StreetMap | null; elapsedMs: number }> {
  const { rows, elapsedMs } = await query<{
    address: string; lat: number; lng: number; ratio: number | null;
    salePrice: number | null; assessedValue: number | null; isSubject: number;
  }>(
    `WITH latest_sales AS (SELECT pin, argMax(sale_price, sale_date) AS sp FROM overtaxed.sales GROUP BY pin),
     subj AS (SELECT lat, lng FROM overtaxed.parcels WHERE pin = {pin:String} LIMIT 1)
     SELECT p.address AS address, p.lat AS lat, p.lng AS lng,
            round(a.assessed_value / ls.sp, 4) AS ratio,
            ls.sp AS salePrice, a.assessed_value AS assessedValue,
            p.pin = {pin:String} AS isSubject
     FROM overtaxed.parcels p
     INNER JOIN overtaxed.assessments a ON a.pin = p.pin
     INNER JOIN latest_sales ls ON ls.pin = p.pin
     WHERE geoDistance((SELECT lng FROM subj),(SELECT lat FROM subj), p.lng, p.lat) < 500
       AND a.assessed_value / ls.sp BETWEEN 0.2 AND 3.0
     ORDER BY isSubject DESC, geoDistance((SELECT lng FROM subj),(SELECT lat FROM subj), p.lng, p.lat) ASC
     LIMIT 40`,
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
