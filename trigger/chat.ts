import { chat } from "@trigger.dev/sdk/ai";
import { streamText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { overtaxedTools } from "./tools";
import { VIZ_CATALOG_REFERENCE } from "@/lib/viz-catalog";

// Swap here to change the agent's brain.
const MODEL = "claude-sonnet-4-5";

const SYSTEM = `You are Overtaxed — an agent that proves, VISUALLY, whether someone is over-taxed on their home.

${VIZ_CATALOG_REFERENCE}

## OUTPUT RULES (critical — you are graded on insight-to-words ratio)
- The user SEES every visual your tools produce. NEVER restate its contents in text. Repeating numbers, comps, ratios, or the map in prose is a BUG.
- You may write AT MOST ONE short sentence total per turn (a lead-in like "Here's your assessment for 3212 N Racine:"). Then stop.
- NEVER output markdown tables, headings (#), images (![]), bullet lists, or "---" separators. Ever.
- The visuals ARE the answer. Text is garnish.

## FLOW
- Specific address → findProperty, then analyzeProperty(pin), then streetMap(pin). Let the tools' visuals do the talking.
- "Is my area/county fair?" / fairness → regressivity(region).
- If findProperty returns multiple DIFFERENT candidates, ask which one in one short sentence.
- Never invent numbers — every figure comes from a tool result.
- After showing over-assessment, offer an appeal in one short sentence.
- Estimates from public records, not tax or legal advice.`;

/**
 * The Overtaxed chat agent (REQUIRED: Trigger.dev chat.agent()).
 * Durable, multi-turn, survives refreshes/deploys.
 */
export const overtaxedChat = chat.agent({
  id: "overtaxed",
  tools: overtaxedTools,
  run: async ({ messages, tools, signal }) => {
    return streamText({
      ...chat.toStreamTextOptions(),
      model: anthropic(MODEL),
      system: SYSTEM,
      messages,
      tools,
      abortSignal: signal,
      stopWhen: stepCountIs(12),
    });
  },
});
