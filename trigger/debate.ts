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
    const pctHigher = Math.max(0, Math.round((facts.assessed / facts.market - 1) * 100));
    const brief =
      `Home at ${facts.address}. The tax office values it at ${money(facts.assessed)}, but similar homes nearby recently sold for about ${money(facts.market)} — roughly ${pctHigher}% higher than it looks worth. That works out to about ${money(facts.overpay)} a year in extra tax, and we're going off ${facts.compsCount} real nearby sales.`;

    const TONE =
      "Write in warm, plain English a regular homeowner instantly understands. Exactly 2 short sentences. Use round dollar amounts and everyday words. Never use jargon like 'assessment ratio', 'median', 'comparables', or percentages-of-ratios. Talk like a straight-talking friend, not a lawyer. No preamble.";

    const [forCase, againstCase] = await Promise.all([
      generateText({
        model: anthropic(MODEL),
        system: `You are on the homeowner's side. Tell them, simply, why it's worth challenging this tax bill. ${TONE}`,
        prompt: brief,
      }),
      generateText({
        model: anthropic(MODEL),
        system: `You are a fair, honest friend giving the other side. Gently explain why appealing might not be worth it or might not work (the homes compared aren't identical, the gap is small, it takes effort, or the office could re-check and not budge). Be kind and balanced. ${TONE}`,
        prompt: brief,
      }),
    ]);

    const file = facts.overpay > 0 && (facts.appealStrength === "strong" || facts.appealStrength === "moderate");
    return {
      forCase: forCase.text.trim(),
      againstCase: againstCase.text.trim(),
      recommendation: file ? ("file" as const) : ("hold" as const),
      rationale: file
        ? `Worth doing: you could claim back about ${money(facts.overpay)} a year, and ${facts.compsCount} nearby sales back you up.`
        : `Probably not worth it: the likely saving is small, and filing takes a bit of effort.`,
    };
  },
});
