import { task } from "@trigger.dev/sdk";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

const MODEL = "claude-sonnet-4-5";

export type DebateFacts = {
  address: string;
  assessed: number;
  market: number;
  ratio: number;
  medianRatio: number;
  overpay: number;
  appealStrength: string;
  compsCount: number;
  currency: "USD" | "GBP";
};

/**
 * A durable Trigger.dev sub-task: two AI advocates argue whether to appeal,
 * running in parallel, before a deterministic verdict. Delegated from the
 * chat agent's `debateAppeal` tool (parent → child task orchestration).
 */
export const appealDebate = task({
  id: "appeal-debate",
  maxDuration: 120,
  run: async (facts: DebateFacts) => {
    const money = (n: number) => `${facts.currency === "GBP" ? "£" : "$"}${Math.round(n).toLocaleString("en-US")}`;
    const brief =
      `Property: ${facts.address}. Assessor's value ${money(facts.assessed)}; comparable market value ${money(facts.market)}; ` +
      `assessment ratio ${facts.ratio.toFixed(2)} vs neighbourhood median ${facts.medianRatio.toFixed(2)}; ` +
      `estimated annual overpayment ${money(facts.overpay)}; ${facts.compsCount} comparable sales nearby.`;

    const [forCase, againstCase] = await Promise.all([
      generateText({
        model: anthropic(MODEL),
        system:
          "You are the HOMEOWNER'S ADVOCATE. In exactly 2 short, punchy sentences, argue why they SHOULD appeal this property-tax assessment. Cite the concrete numbers. No preamble, no hedging.",
        prompt: brief,
      }),
      generateText({
        model: anthropic(MODEL),
        system:
          "You are the ASSESSOR'S DEVIL'S ADVOCATE. In exactly 2 short, fair sentences, argue why this appeal might FAIL or not be worth the effort (imperfect comps, small margin, effort, or risk the assessor re-values). No preamble.",
        prompt: brief,
      }),
    ]);

    const file = facts.overpay > 0 && (facts.appealStrength === "strong" || facts.appealStrength === "moderate");
    return {
      forCase: forCase.text.trim(),
      againstCase: againstCase.text.trim(),
      recommendation: file ? ("file" as const) : ("hold" as const),
      rationale: file
        ? `The case to appeal is stronger: a ${money(facts.overpay)}/yr overpayment backed by ${facts.compsCount} comparable sales.`
        : `It's marginal — the likely saving may not outweigh the effort or the risk of re-valuation.`,
    };
  },
});
