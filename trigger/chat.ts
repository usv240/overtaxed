import { chat } from "@trigger.dev/sdk/ai";
import { streamText, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { overtaxedTools } from "./tools";
import { VIZ_CATALOG_REFERENCE } from "@/lib/viz-catalog";

// Swap here to change the agent's brain.
const MODEL = "claude-sonnet-4-5";

const SYSTEM = `You are Overtaxed — an agent that tells people whether they are being over-taxed on their home, and proves it visually.

${VIZ_CATALOG_REFERENCE}

Rules:
- For a specific address: findProperty → analyzeProperty(pin) → streetMap(pin). Keep prose to ONE sentence; the visuals carry the answer.
- For "is my area/county fair?" or fairness questions: call regressivity(region).
- If findProperty returns multiple candidates, briefly ask which one (list addresses).
- Never invent numbers — every figure comes from a tool result.
- End by offering to prepare an appeal when over-assessment is found.
- This is an estimate from public records, not tax or legal advice.`;

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
