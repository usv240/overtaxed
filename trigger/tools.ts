import { tool } from "ai";
import { z } from "zod";
import {
  findProperty,
  analyzeProperty,
  getRegressivity,
  getStreetMap,
  generateAppealPacket,
  checkUkBand,
  getFairnessLeaderboard,
} from "@/lib/queries";
import { appealDebate } from "./debate";
import type { VizSpec } from "@/lib/viz-catalog";

/**
 * Agent tools. Each data tool returns one or more VizSpecs in `visuals` — the
 * frontend renders those directly, so the agent's answer is ALWAYS a visual.
 * `elapsedMs`/`rowsRead` ride along to power the "⚡ N ms over M rows" badge.
 */

export const findPropertyTool = tool({
  description:
    "Resolve a free-text home address to candidate parcels. Call this FIRST for any address. If exactly one candidate, proceed to analyzeProperty with its pin.",
  inputSchema: z.object({
    address: z.string().describe("free-text address or street, e.g. '3212 N Racine, Chicago'"),
  }),
  execute: async ({ address }) => {
    const { candidates, elapsedMs } = await findProperty(address);
    return {
      candidates,
      elapsedMs,
      count: candidates.length,
      message:
        candidates.length === 0
          ? "No match. US coverage is currently Cook County, Illinois; the UK is a demo area (SW11, London). Suggest an example address."
          : undefined,
    };
  },
});

export const analyzePropertyTool = tool({
  description:
    "Analyse a parcel (by pin) for over-assessment vs comparable sales. Returns a verdict card + comps table. Use for 'am I overtaxed at <address>?'.",
  inputSchema: z.object({ pin: z.string() }),
  execute: async ({ pin }) => {
    const res = await analyzeProperty(pin);
    if (!res.found) return { found: false, visuals: [] as VizSpec[], elapsedMs: res.elapsedMs };
    const visuals: VizSpec[] = [res.verdict!, res.comps!];
    return { found: true, visuals, meta: res.meta, elapsedMs: res.elapsedMs };
  },
});

export const streetMapTool = tool({
  description:
    "Render the subject home vs its neighbours on a map, coloured by assessment ratio (red = over-assessed). Call after analyzeProperty.",
  inputSchema: z.object({ pin: z.string() }),
  execute: async ({ pin }) => {
    const { spec, elapsedMs } = await getStreetMap(pin);
    return { visuals: spec ? [spec] : [], elapsedMs };
  },
});

export const regressivityTool = tool({
  description:
    "THE fairness exposé. Compute PRD & COD for a whole region and return a scatter of sale price vs assessment ratio. Use for 'is my county/area fair?' or to reveal systemic regressivity.",
  inputSchema: z.object({
    region: z.enum(["Cook County", "Allegheny County"]).describe("US county to analyse for assessment fairness"),
  }),
  execute: async ({ region }) => {
    const { spec, elapsedMs, rowsRead } = await getRegressivity(region);
    return { visuals: [spec], prd: spec.prd, cod: spec.cod, elapsedMs, rowsRead };
  },
});

export const appealPacketTool = tool({
  description:
    "Generate a ready-to-file appeal packet (grounds, proposed value, evidence, filing link) for a parcel. Call ONLY after the user agrees to appeal.",
  inputSchema: z.object({ pin: z.string() }),
  execute: async ({ pin }) => {
    const { spec, elapsedMs } = await generateAppealPacket(pin);
    return { visuals: spec ? [spec] : [], elapsedMs };
  },
});

export const checkUkBandTool = tool({
  description:
    "UK ONLY. Check if a UK home is in the wrong council tax band (neighbour comparison + 1991 back-cast). Use for UK addresses/postcodes. Returns a verdict + a band map. No findProperty needed first.",
  inputSchema: z.object({ address: z.string().describe("UK address or postcode") }),
  execute: async ({ address }) => {
    const { found, verdict, street, elapsedMs } = await checkUkBand(address);
    const visuals: VizSpec[] = found ? [verdict!, street!] : [];
    return { found, visuals, elapsedMs };
  },
});

export const debateAppealTool = tool({
  description:
    "US only. Run a 'for vs against' debate on whether the user should appeal: two AI advocates argue it (via a durable Trigger.dev sub-task) before a verdict. Use when the user asks 'should I appeal?', wants a second opinion, or asks to hear both sides. Needs the pin from analyzeProperty.",
  inputSchema: z.object({ pin: z.string() }),
  execute: async ({ pin }) => {
    const a = await analyzeProperty(pin);
    if (!a.found || !a.meta) return { visuals: [] as VizSpec[], elapsedMs: a.elapsedMs };
    const m = a.meta;
    const run = await appealDebate.triggerAndWait({
      address: m.address,
      assessed: m.assessed,
      market: m.recent_sale,
      ratio: m.ratio,
      medianRatio: m.median_ratio,
      overpay: m.annualOverpay,
      appealStrength: m.appealStrength,
      compsCount: a.comps?.comps.length ?? 0,
      currency: "USD",
    });
    if (!run.ok) return { visuals: [] as VizSpec[], elapsedMs: a.elapsedMs };
    const d = run.output;
    const spec: VizSpec = {
      kind: "appealDebate",
      forCase: d.forCase,
      againstCase: d.againstCase,
      recommendation: d.recommendation,
      rationale: d.rationale,
    };
    return { visuals: [spec], elapsedMs: a.elapsedMs };
  },
});

export const fairnessLeaderboardTool = tool({
  description:
    "Rank the neighbourhoods/townships of a US county by how regressively they assess homes (which areas over-tax cheaper homes most). Use for 'which areas are most unfair?', 'worst neighbourhoods', 'rank townships'. Currently Cook County.",
  inputSchema: z.object({ region: z.enum(["Cook County"]).describe("US county") }),
  execute: async ({ region }) => {
    const { spec, elapsedMs, rowsRead } = await getFairnessLeaderboard(region);
    return { visuals: [spec], elapsedMs, rowsRead };
  },
});

export const overtaxedTools = {
  findProperty: findPropertyTool,
  checkUkBand: checkUkBandTool,
  debateAppeal: debateAppealTool,
  fairnessLeaderboard: fairnessLeaderboardTool,
  analyzeProperty: analyzePropertyTool,
  streetMap: streetMapTool,
  regressivity: regressivityTool,
  generateAppealPacket: appealPacketTool,
};
