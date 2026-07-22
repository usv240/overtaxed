/**
 * REFERENCE PARAMETERS — every external input in one transparent, sourced place.
 *
 * The analytics (comps, ratios, PRD/COD, regressivity) are computed 100% live
 * from real data in ClickHouse. The values below are the small set of inputs
 * that are statutory or published figures (not derivable from the sale/assessment
 * data itself). They are named + sourced here rather than buried in queries, and
 * are surfaced to users on /methodology.
 */

// ── US: Cook County ──────────────────────────────────────────────────────────
// Effective residential property-tax rate (tax paid ÷ market value). Cook County
// Treasurer / Civic Federation report a countywide residential effective rate of
// ~2.0–2.5%. We use the conservative upper end.
// Source: Cook County Treasurer "Effective Tax Rates" reports.
export const US_EFFECTIVE_TAX_RATE: Record<string, number> = {
  "Cook County": 0.025,
};
export const US_DEFAULT_EFFECTIVE_RATE = 0.02;

// Cook County residential assessment level is 10% of market value (statutory);
// datasets report assessed value at that level, so market value = assessed × 10.
// Source: 35 ILCS 200; Cook County Assessor.
export const COOK_ASSESSMENT_LEVEL = 0.1;

// ── UK: council tax ──────────────────────────────────────────────────────────
// Council tax bands are proportional to Band D (statutory national ratios).
// Source: Local Government Finance Act 1992, s.5.
export const UK_BAND_FACTOR: Record<string, number> = {
  A: 6 / 9, B: 7 / 9, C: 8 / 9, D: 1, E: 11 / 9, F: 13 / 9, G: 15 / 9, H: 18 / 9,
};

// 1991 property-value ranges per band, England (statutory valuation date 1 Apr 1991).
// Source: The Council Tax (Situation and Valuation of Dwellings) Regulations 1992.
export const UK_BAND_1991: [string, number, number][] = [
  ["A", 0, 40000], ["B", 40001, 52000], ["C", 52001, 68000], ["D", 68001, 88000],
  ["E", 88001, 120000], ["F", 120001, 160000], ["G", 160001, 320000], ["H", 320001, 1e12],
];

// Per-council Band D amounts are loaded LIVE into ClickHouse (overtaxed.uk_band_d)
// from gov.uk Table 7a. This is only the fallback: the England average Band D.
// Source: gov.uk "Council Tax levels set by local authorities in England 2024-25".
export const UK_DEFAULT_BAND_D_ANNUAL = 2171;

// Sale → 1991 back-cast divisor (nominal house-price growth 1991→present) by region.
// Source: Nationwide / HM Land Registry UK House Price Index.
export const UK_HPI_1991_DIVISOR: Record<string, number> = {
  "GREATER LONDON": 7.5,
};
export const UK_DEFAULT_HPI_DIVISOR = 5.3;

// helpers
export const bandIndex: Record<string, number> = { A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8 };
export const bandLetter = ["", "A", "B", "C", "D", "E", "F", "G", "H"];
export const bandFor1991 = (v: number) =>
  UK_BAND_1991.find(([, lo, hi]) => v >= lo && v <= hi)?.[0] ?? "H";
