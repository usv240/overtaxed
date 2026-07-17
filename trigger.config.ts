import { defineConfig } from "@trigger.dev/sdk";

/**
 * Trigger.dev is the orchestration layer for Overtaxed:
 *  - chat.agent("overtaxed") — the durable chat agent (required by the brief)
 *  - long-running ingestion tasks that stream public CSVs into ClickHouse
 *  - a retryable live UK council-tax band lookup
 *  - appeal-packet generation
 */
export default defineConfig({
  project: process.env.TRIGGER_PROJECT_REF ?? "proj_tscqzltxigwvlihuprmk",
  dirs: ["./trigger"],
  maxDuration: 3600, // ingestion tasks can run long — that's the point
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 30000,
      factor: 2,
      randomize: true,
    },
  },
});
