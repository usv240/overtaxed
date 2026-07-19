"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { useTriggerChatTransport } from "@trigger.dev/sdk/chat/react";
import type { overtaxedChat } from "@/trigger/chat";
import { mintChatAccessToken, startChatSession } from "@/app/actions";
import { VizRenderer } from "./VizRenderer";
import { ThemeToggle } from "./ThemeToggle";
import { Icon } from "./Icon";
import type { VizSpec } from "@/lib/viz-catalog";

const EXAMPLES = [
  { icon: "home", title: "Check a US home", q: "Am I overtaxed at 4317 N Monticello Ave, Chicago?" },
  { icon: "chart", title: "Is my county fair?", q: "Is Cook County assessed fairly?" },
  { icon: "pin", title: "Check a UK band", q: "Check 12 Lavender Sweep, London SW11" },
] as const;

/** Pull VizSpecs (+ timing) out of a message's tool-output parts. */
function extractVisuals(parts: any[]): { spec: VizSpec; ms?: number; rows?: number }[] {
  const out: { spec: VizSpec; ms?: number; rows?: number }[] = [];
  for (const p of parts ?? []) {
    const isTool = typeof p?.type === "string" && p.type.startsWith("tool-");
    const output = p?.output ?? p?.result ?? p?.toolInvocation?.result;
    if (isTool && output && Array.isArray(output.visuals)) {
      for (const spec of output.visuals) out.push({ spec, ms: output.elapsedMs, rows: output.rowsRead });
    }
  }
  return out;
}

function Dots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 150, 300].map((d) => (
        <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${d}ms` }} />
      ))}
    </span>
  );
}

export function Chat() {
  const transport = useTriggerChatTransport<typeof overtaxedChat>({
    task: "overtaxed",
    accessToken: ({ chatId }) => mintChatAccessToken(chatId),
    startSession: ({ chatId, clientData }) => startChatSession({ chatId, clientData }),
  });

  const { messages, sendMessage, stop, status } = useChat({ transport });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const send = (text: string) => {
    if (!text.trim()) return;
    sendMessage({ text });
    setInput("");
  };

  const empty = messages.length === 0;
  const streaming = status === "streaming" || status === "submitted";

  return (
    <div className="flex h-dvh flex-col">
      {/* App bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <a href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-sm text-accent-fg">O</span>
            Overtaxed
          </a>
          <nav className="flex items-center gap-1.5 text-sm">
            <a href="/methodology" className="hidden rounded-full px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-foreground sm:inline">Methodology</a>
            <a href="/portfolio" className="rounded-full px-3 py-1.5 text-muted hover:bg-surface-2 hover:text-foreground">My Portfolio</a>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Conversation */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {empty ? (
            <div className="flex flex-col items-center pt-8 text-center sm:pt-16">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent shadow-sm">
                <Icon name="home" size={30} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">What home should we check?</h1>
              <p className="mt-2 max-w-md text-muted">
                Type any address — you&apos;ll get a picture back: a verdict, a map of your street, and a ready-to-file appeal. Not a wall of text.
              </p>
              <div className="mt-8 grid w-full gap-3 sm:grid-cols-3">
                {EXAMPLES.map((e) => (
                  <button
                    key={e.q}
                    onClick={() => send(e.q)}
                    className="group rounded-2xl border border-border bg-surface p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
                  >
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent">
                      <Icon name={e.icon} size={18} />
                    </div>
                    <div className="mt-2.5 text-sm font-semibold">{e.title}</div>
                    <div className="mt-1 text-xs leading-snug text-muted">{e.q}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => {
                const visuals = m.role === "assistant" ? extractVisuals((m as any).parts) : [];
                const text = ((m as any).parts ?? []).filter((p: any) => p.type === "text").map((p: any) => p.text).join("");
                return (
                  <div key={m.id}>
                    {text && (
                      <div className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          m.role === "user" ? "bg-accent text-accent-fg" : "bg-surface-2"}`}>
                          {text}
                        </div>
                      </div>
                    )}
                    {visuals.map((v, i) => <VizRenderer key={i} spec={v.spec} ms={v.ms} rows={v.rows} />)}
                  </div>
                );
              })}
              {streaming && (
                <div className="flex items-center gap-2 px-1 text-sm text-muted">
                  <Dots /> analysing…
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-background/80 backdrop-blur-md">
        {!empty && (
          <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 pt-2.5 pb-0.5">
            <span className="shrink-0 self-center text-xs text-muted">Try:</span>
            {EXAMPLES.map((e) => (
              <button
                key={e.q}
                onClick={() => send(e.q)}
                className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted shadow-sm transition-colors hover:border-accent hover:text-foreground"
              >
                <Icon name={e.icon} size={13} /> {e.title}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="mx-auto flex max-w-3xl items-center gap-2 px-4 pt-3">
          <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-surface px-4 py-1 shadow-sm focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
            <Icon name="pin" size={16} className="shrink-0 text-muted" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter a home address…"
              className="flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted"
            />
          </div>
          {streaming ? (
            <button type="button" onClick={stop} className="rounded-full bg-surface-2 px-4 py-2.5 text-sm font-medium">Stop</button>
          ) : (
            <button type="submit" disabled={!input.trim()} className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-fg shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-40">Send</button>
          )}
        </form>
        <p className="py-2.5 text-center text-xs text-muted">Estimates from public records · not tax or legal advice</p>
      </div>
    </div>
  );
}
