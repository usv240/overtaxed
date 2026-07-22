"use client";

import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { useTriggerChatTransport } from "@trigger.dev/sdk/chat/react";
import type { overtaxedChat } from "@/trigger/chat";
import { mintChatAccessToken, startChatSession } from "@/app/actions";
import { VizRenderer } from "./VizRenderer";
import { ThemeToggle } from "./ThemeToggle";
import { Icon } from "./Icon";
import { ContextPanel, type Stats } from "./ContextPanel";
import type { VizSpec } from "@/lib/viz-catalog";

const compactN = (n: number) => Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

const EXAMPLES = [
  { icon: "home", title: "Check a US home", q: "Am I overtaxed at 4317 N Monticello Ave, Chicago?" },
  { icon: "grid", title: "The Tax Divide map", q: "Show me the Tax Divide map for Cook County" },
  { icon: "chart", title: "Is Cook County fair?", q: "Is Cook County assessed fairly?" },
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

/** True while the debate sub-task has been called but hasn't returned yet. */
function debatePending(parts: any[]): boolean {
  for (const p of parts ?? []) {
    const t = typeof p?.type === "string" ? p.type : "";
    const isDebate = t.includes("debateAppeal") || (t === "dynamic-tool" && p?.toolName === "debateAppeal");
    if (isDebate) {
      const hasOutput = p?.output ?? p?.result ?? p?.toolInvocation?.result;
      if (!hasOutput && p?.state !== "output-available" && p?.state !== "output-error") return true;
    }
  }
  return false;
}

function DebateLoader() {
  const bar = "h-2 rounded bg-black/10 dark:bg-white/15";
  return (
    <div className="my-3 rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-1.5">
        <Icon name="message" size={16} className="text-accent" />
        <h4 className="font-semibold">Should you appeal? Two AI advocates are debating…</h4>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {["For appealing", "Against"].map((label, i) => (
          <div key={label} className={`rounded-xl border p-3 ${i === 0 ? "border-pos/25 bg-pos/5" : "border-warn/25 bg-warn/5"}`}>
            <div className={`mb-2 text-xs font-semibold uppercase tracking-wide ${i === 0 ? "text-pos" : "text-warn"}`}>{label}</div>
            <div className="animate-pulse space-y-1.5">
              <div className={bar} style={{ width: "95%" }} />
              <div className={bar} style={{ width: "88%" }} />
              <div className={bar} style={{ width: "66%" }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted"><Dots /> running a durable Trigger.dev sub-task…</p>
    </div>
  );
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

export function Chat({ stats }: { stats: Stats }) {
  const transport = useTriggerChatTransport<typeof overtaxedChat>({
    task: "overtaxed",
    accessToken: ({ chatId }) => mintChatAccessToken(chatId),
    startSession: ({ chatId, clientData }) => startChatSession({ chatId, clientData }),
  });

  const { messages, sendMessage, stop, status } = useChat({ transport });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 140;
  };

  useEffect(() => {
    // only auto-scroll if the user is already at the bottom, never yank them up
    const el = scrollRef.current;
    if (el && atBottomRef.current) el.scrollTop = el.scrollHeight;
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
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
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

      <div className="flex flex-1 overflow-hidden">
        {/* Conversation column */}
        <main className="flex flex-1 flex-col overflow-hidden">
      <div ref={scrollRef} onScroll={onScroll} className="flex-1 overflow-y-auto">
          {empty ? (
            <div className="hero-glow mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center rounded-3xl px-4 py-8 text-center">
              <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-muted shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-pos" /> Property tax, made visual
              </div>
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-accent shadow-md ring-1 ring-accent/10">
                <Icon name="home" size={30} />
              </div>
              <h1 className="text-[28px] font-bold leading-[1.1] tracking-tight sm:text-4xl">What home should we check?</h1>
              <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
                Type any address and get a picture back: a verdict, a map of your street, and a ready-to-file appeal. Not a wall of text.
              </p>
              <div className="mt-8 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {EXAMPLES.map((e) => (
                  <button
                    key={e.q}
                    onClick={() => send(e.q)}
                    className="group rounded-2xl border border-border bg-surface p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
                  >
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent ring-1 ring-accent/10 transition-transform group-hover:scale-105">
                      <Icon name={e.icon} size={18} />
                    </div>
                    <div className="mt-3 flex items-center gap-1 text-sm font-semibold tracking-tight">
                      {e.title}
                      <Icon name="arrowRight" size={13} className="text-muted opacity-0 -translate-x-1 transition-all group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-accent" />
                    </div>
                    <div className="mt-1 text-xs leading-snug text-muted">{e.q}</div>
                  </button>
                ))}
              </div>

              <p className="mt-7 max-w-lg text-sm leading-relaxed text-muted">
                <strong className="text-foreground">~${compactN(stats.nationalAnnual)}/yr</strong> is over-shifted onto lower-value US homes by biased assessments, projected from the ${compactN(stats.impactAnnual)} we measure live in Cook County.{" "}
                <a href="/methodology" className="font-medium text-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent">See the maths.</a>
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl px-4 py-6">
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
                    {m.role === "assistant" && debatePending((m as any).parts) && <DebateLoader />}
                  </div>
                );
              })}
              {streaming && (
                <div className="flex items-center gap-2 px-1 text-sm text-muted">
                  <Dots /> analysing…
                </div>
              )}
              </div>
            </div>
          )}
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
          <div className="flex flex-1 items-center gap-2 rounded-full border border-border-strong bg-surface px-4 py-1 shadow-sm transition-all focus-within:border-accent focus-within:shadow-md focus-within:ring-4 focus-within:ring-accent/10">
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
        </main>

        {/* Persistent context sidebar */}
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-border bg-surface-2/30 lg:block xl:w-96">
          <ContextPanel stats={stats} />
        </aside>
      </div>
    </div>
  );
}
