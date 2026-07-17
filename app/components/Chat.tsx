"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { useTriggerChatTransport } from "@trigger.dev/sdk/chat/react";
import type { overtaxedChat } from "@/trigger/chat";
import { mintChatAccessToken, startChatSession } from "@/app/actions";
import { VizRenderer } from "./VizRenderer";
import type { VizSpec } from "@/lib/viz-catalog";

const SUGGESTIONS = [
  "Am I overtaxed at 4317 N Monticello Ave, Chicago?",
  "Is Cook County assessed fairly?",
  "Check 12 Lavender Sweep, London SW11",
];

/** Pull VizSpecs (+ timing) out of a message's tool-output parts. */
function extractVisuals(parts: any[]): { spec: VizSpec; ms?: number; rows?: number }[] {
  const out: { spec: VizSpec; ms?: number; rows?: number }[] = [];
  for (const p of parts ?? []) {
    const isTool = typeof p?.type === "string" && p.type.startsWith("tool-");
    const output = p?.output ?? p?.result ?? p?.toolInvocation?.result;
    if (isTool && output && Array.isArray(output.visuals)) {
      for (const spec of output.visuals) {
        out.push({ spec, ms: output.elapsedMs, rows: output.rowsRead });
      }
    }
  }
  return out;
}

export function Chat() {
  const transport = useTriggerChatTransport<typeof overtaxedChat>({
    task: "overtaxed",
    accessToken: ({ chatId }) => mintChatAccessToken(chatId),
    startSession: ({ chatId, clientData }) => startChatSession({ chatId, clientData }),
  });

  const { messages, sendMessage, stop, status } = useChat({ transport });
  const [input, setInput] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    sendMessage({ text });
    setInput("");
  };

  return (
    <div className="mx-auto flex h-dvh max-w-2xl flex-col">
      <header className="flex items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-lg font-bold">Overtaxed</h1>
          <p className="text-xs text-neutral-500">Type your address — see if you&apos;re overpaying. The answer is a picture, not a paragraph.</p>
        </div>
        <a href="/portfolio" className="rounded-full border border-black/10 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5">My Portfolio</a>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-4">
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 pt-4">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)}
                className="rounded-full border border-black/10 px-3 py-1.5 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5">
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m) => {
          const visuals = m.role === "assistant" ? extractVisuals((m as any).parts) : [];
          const text = ((m as any).parts ?? [])
            .filter((p: any) => p.type === "text")
            .map((p: any) => p.text)
            .join("");
          return (
            <div key={m.id} className={m.role === "user" ? "text-right" : ""}>
              {text && (
                <div className={`inline-block rounded-2xl px-3 py-2 text-sm ${
                  m.role === "user" ? "bg-blue-600 text-white" : "bg-black/5 dark:bg-white/10"}`}>
                  {text}
                </div>
              )}
              {visuals.map((v, i) => <VizRenderer key={i} spec={v.spec} ms={v.ms} rows={v.rows} />)}
            </div>
          );
        })}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 p-4">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Enter a home address…"
          className="flex-1 rounded-full border border-black/15 px-4 py-2 text-sm outline-none focus:border-blue-500 dark:border-white/20 dark:bg-neutral-900" />
        {status === "streaming"
          ? <button type="button" onClick={stop} className="rounded-full bg-neutral-200 px-4 py-2 text-sm dark:bg-neutral-700">Stop</button>
          : <button type="submit" className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white">Send</button>}
      </form>
    </div>
  );
}
