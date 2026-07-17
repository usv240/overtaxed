// Trigger a Trigger.dev task by id and wait for it to finish.
// Usage: node scripts/run-task.mjs ingest-uk-land-registry '{"year":2023}'
import { readFileSync } from "node:fs";

try {
  for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {}

const { tasks, runs, configure } = await import("@trigger.dev/sdk");
configure({ secretKey: process.env.TRIGGER_SECRET_KEY });

const id = process.argv[2];
const payload = JSON.parse(process.argv[3] || "{}");
if (!id) throw new Error("usage: node scripts/run-task.mjs <task-id> '<json-payload>'");

const handle = await tasks.trigger(id, payload);
console.log(`triggered ${id} → run ${handle.id}`);

const DONE = ["COMPLETED", "FAILED", "CANCELED", "TIMED_OUT", "CRASHED", "SYSTEM_FAILURE"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let run;
do {
  await sleep(3000);
  run = await runs.retrieve(handle.id);
  process.stdout.write(`  ${run.status}\n`);
} while (!DONE.includes(run.status));

console.log("\nfinal:", run.status);
if (run.output) console.log("output:", JSON.stringify(run.output, null, 2));
if (run.error) console.log("error:", run.error);
process.exit(run.status === "COMPLETED" ? 0 : 1);
