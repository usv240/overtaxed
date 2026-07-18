import { z } from "zod";

/**
 * THE VISUALIZATION CATALOG — the heart of "Beyond the Wall of Text."
 *
 * The agent may ONLY answer by emitting one of these specs via the
 * `renderVisualization` tool. There is deliberately no free-text answer path
 * for a result: if the best answer is a paragraph, that's a bug.
 *
 * One module defines both (a) the zod schema that validates the agent's tool
 * call and (b) the TypeScript types the React renderer consumes — so the prompt
 * and the renderer can never drift apart.
 */

export const Confidence = z.enum(["high", "medium", "low"]);
export const AppealStrength = z.enum(["strong", "moderate", "weak", "none"]);
export const Currency = z.enum(["USD", "GBP"]);

/** A single property point on the street map, coloured by its assessment ratio. */
const GeoRatioPoint = z.object({
  address: z.string(),
  lat: z.number(),
  lng: z.number(),
  /** assessed value / recent sale price. >1 area-median ⇒ over-assessed. */
  ratio: z.number().nullable(),
  salePrice: z.number().nullable().optional(),
  assessedValue: z.number().nullable().optional(),
  isSubject: z.boolean().default(false),
});

/** 1 — the headline verdict. The one-glance "am I overpaying?" answer. */
export const VerdictCard = z.object({
  kind: z.literal("verdictCard"),
  headline: z.string(), // e.g. "You're overpaying ~$1,400/yr"
  overpaymentPerPeriod: z.number(),
  period: z.enum(["year", "month"]).default("year"),
  currency: Currency,
  owedBack: z.number().nullable().optional(), // backdated refund (UK)
  confidence: Confidence,
  appealStrength: AppealStrength,
  subtitle: z.string().optional(),
  /** plain-English explanation for non-technical users */
  simple: z.string().optional(),
  /** the underlying numbers / formula, for the "show the maths" view */
  technicalRows: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
});

/** 2 — the street map: your home glows against your neighbours' ratios. */
export const StreetMap = z.object({
  kind: z.literal("streetMap"),
  center: z.object({ lat: z.number(), lng: z.number() }),
  zoom: z.number().default(15),
  subject: GeoRatioPoint,
  neighbours: z.array(GeoRatioPoint),
  legend: z.string().default("Assessment ratio vs neighbourhood median"),
});

/** 3 — THE INNOVATION: the regressivity exposé for a whole area. */
export const RegressivityScatter = z.object({
  kind: z.literal("regressivityScatter"),
  region: z.string(),
  points: z.array(
    z.object({ salePrice: z.number(), ratio: z.number() }),
  ),
  /** Price-Related Differential — >1.03 ⇒ regressive (poor over-taxed). */
  prd: z.number(),
  /** Coefficient of Dispersion — assessment uniformity (lower = fairer). */
  cod: z.number(),
  /** total parcels analysed (points may be a sample of this). */
  nParcels: z.number().optional(),
  /** avg assessment ratio by sale-price quintile — the regressivity gradient. */
  quintiles: z
    .array(z.object({ quintile: z.number(), avgPrice: z.number(), avgRatio: z.number() }))
    .optional(),
  trend: z.object({ slope: z.number(), intercept: z.number() }).optional(),
  caption: z.string().optional(),
  /** plain-English explanation for non-technical users */
  simple: z.string().optional(),
});

/** 4 — where you sit in the neighbourhood distribution. */
export const DistributionStrip = z.object({
  kind: z.literal("distributionStrip"),
  label: z.string(),
  values: z.array(z.number()),
  subjectValue: z.number(),
  unit: z.string().default("ratio"),
  subjectPercentile: z.number().optional(),
});

/** 5 — the comparable sales the agent used (transparency = credibility). */
export const CompsTable = z.object({
  kind: z.literal("compsTable"),
  subjectAddress: z.string(),
  fairValueEstimate: z.number().optional(),
  comps: z.array(
    z.object({
      address: z.string(),
      salePrice: z.number(),
      saleDate: z.string(),
      distanceMi: z.number(),
      ratio: z.number().nullable().optional(),
    }),
  ),
});

/** 6 — the actionable payoff: a pre-filled appeal. */
export const AppealPacket = z.object({
  kind: z.literal("appealPacket"),
  jurisdiction: z.string(),
  summary: z.string(),
  fields: z.array(z.object({ label: z.string(), value: z.string() })),
  downloadUrl: z.string().nullable().optional(),
  filingUrl: z.string().nullable().optional(),
  // structured identity so the app can persist it (OLTP)
  pin: z.string().nullable().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  region: z.string().nullable().optional(),
  estimatedAnnualSaving: z.number().optional(),
});

/** The discriminated union the agent must produce. */
export const VizSpec = z.discriminatedUnion("kind", [
  VerdictCard,
  StreetMap,
  RegressivityScatter,
  DistributionStrip,
  CompsTable,
  AppealPacket,
]);

export type VizSpec = z.infer<typeof VizSpec>;
export type VerdictCard = z.infer<typeof VerdictCard>;
export type StreetMap = z.infer<typeof StreetMap>;
export type RegressivityScatter = z.infer<typeof RegressivityScatter>;
export type DistributionStrip = z.infer<typeof DistributionStrip>;
export type CompsTable = z.infer<typeof CompsTable>;
export type AppealPacket = z.infer<typeof AppealPacket>;

/** Human-readable catalog reference injected into the system prompt. */
export const VIZ_CATALOG_REFERENCE = `
You answer with VISUALS, never walls of text. Call \`renderVisualization\` with one of:
- verdictCard        → the one-line "you're overpaying $X/yr" headline + appeal strength.
- streetMap          → the subject home vs neighbours, coloured by assessment ratio.
- regressivityScatter→ the fairness exposé: sale price vs ratio, with PRD & COD.
- distributionStrip  → where the subject's ratio sits in the neighbourhood.
- compsTable         → the comparable sales used (always show your work).
- appealPacket       → the pre-filled appeal the user can file.
Typical flow for "am I overtaxed at <address>?": verdictCard → streetMap → compsTable,
then offer the appealPacket. For "is my county/area fair?": regressivityScatter.
Keep any text to a one-sentence caption. The visual is the answer.
`.trim();
