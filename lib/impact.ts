/**
 * Scaling the *measured* Cook County over-assessment to a national / UK
 * order-of-magnitude. Every input is public and cited; these are transparent
 * PROJECTIONS (clearly labelled as such in the UI), not hard claims — they exist
 * to show that the Cook County figure is one instance of a national problem.
 *
 * The regressive-assessment pattern is documented nationwide, e.g. Avenancio-León
 * & Howard, "The Assessment Gap" (QJE 2022, ~118M US homes) and C. Berry,
 * "Reassessing the Property Tax" (Univ. of Chicago). Our live Cook County
 * measurement reproduces that pattern locally.
 */

// US Census (2022 ACS): owner-occupied housing units ≈ 86 million.
export const US_OWNER_OCCUPIED_HOMES = 86_000_000;
// Cook County Assessor: ≈ 1.9 million residential parcels.
export const COOK_RESIDENTIAL_PARCELS = 1_900_000;
// Widely reported (UK gov / consumer press): 400,000+ homes in the wrong band.
export const UK_MISBANDED_HOMES = 400_000;
// Order-of-magnitude annual council-tax delta for a one-band error.
export const UK_AVG_BAND_ERROR_ANNUAL = 200;

/**
 * Scale the live Cook County annual over-assessment to the US by owner-occupied
 * homes. ~$460M in Cook × (86M / 1.9M) ≈ tens of billions per year.
 */
export function projectUsAnnual(cookAnnual: number): number {
  if (cookAnnual <= 0) return 0;
  return Math.round(cookAnnual * (US_OWNER_OCCUPIED_HOMES / COOK_RESIDENTIAL_PARCELS));
}

/** UK: mis-banded homes × a typical one-band annual error. */
export function projectUkAnnual(): number {
  return UK_MISBANDED_HOMES * UK_AVG_BAND_ERROR_ANNUAL;
}
