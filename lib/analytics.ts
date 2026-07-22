/**
 * Pure assessment math — no I/O, no ClickHouse. Extracted so the core
 * over-assessment logic is unit-testable and used identically everywhere.
 */

export type AppealStrength = "strong" | "moderate" | "weak" | "none";
export type Confidence = "high" | "medium" | "low";

/** Assessment ratio = assessor's value ÷ true market value. */
export function assessmentRatio(assessed: number, market: number): number {
  if (market <= 0) return 0;
  return assessed / market;
}

/** Fair assessed value = what the home *should* be assessed at, at the local median ratio. */
export function fairValue(market: number, medianRatio: number): number {
  return market * medianRatio;
}

/** Annual property-tax overpayment = (assessed − fair) × effective tax rate, floored at 0. */
export function annualOverpay(assessed: number, fair: number, rate: number): number {
  return Math.round(Math.max(0, assessed - fair) * rate);
}

/** How far above the neighbourhood median this home is assessed (0.1 = 10% over). */
export function overAssessedPct(ratio: number, medianRatio: number): number {
  if (medianRatio <= 0) return 0;
  return ratio / medianRatio - 1;
}

/** Appeal strength from how far over the median the assessment sits. */
export function appealStrength(overPct: number): AppealStrength {
  if (overPct > 0.1) return "strong";
  if (overPct > 0.05) return "moderate";
  if (overPct > 0.02) return "weak";
  return "none";
}

/** Confidence: highest when the home has its own recent sale + plenty of comps. */
export function confidenceLevel(usedComps: boolean, nComps: number): Confidence {
  if (!usedComps && nComps >= 4) return "high";
  if (nComps >= 3) return "medium";
  return "low";
}

/**
 * Extrapolate county-wide annual harm from the measured over-assessment of the
 * *sold* parcels to the whole parcel population. Transparent and shown in the UI:
 *   estCountyAnnual = excessBelowTaxDollars × (totalParcels / sold)
 */
export function extrapolateCountyImpact(
  excessBelowAnnual: number,
  totalParcels: number,
  sold: number,
): number {
  if (sold <= 0) return 0;
  return Math.round(excessBelowAnnual * (totalParcels / sold));
}
