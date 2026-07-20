import { Icon } from "./Icon";

export type Stats = {
  ukSales: number;
  cookParcels: number;
  allegheny: number;
};

const compact = (n: number) => Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">{children}</div>;
}

/** Persistent context sidebar — always-visible substance so the app never feels empty. */
export function ContextPanel({ stats }: { stats: Stats }) {
  return (
    <div className="space-y-7 p-5 text-sm">
      <div>
        <Label>Live data in ClickHouse</Label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { n: compact(stats.ukSales), l: "UK sales (Land Registry)" },
            { n: compact(stats.cookParcels), l: "Cook County parcels" },
            { n: compact(stats.allegheny), l: "Allegheny assessments" },
            { n: "~$460M", l: "Est. yearly harm, Cook Co." },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-border bg-surface p-3">
              <div className="text-lg font-bold tracking-tight text-accent">{s.n}</div>
              <div className="mt-0.5 text-xs leading-snug text-muted">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Coverage</Label>
        <ul className="space-y-1.5 text-muted">
          <li className="flex gap-2"><Icon name="check" size={15} className="mt-0.5 shrink-0 text-pos" /> US — Cook County (Chicago) &amp; Allegheny (Pittsburgh)</li>
          <li className="flex gap-2"><Icon name="check" size={15} className="mt-0.5 shrink-0 text-pos" /> UK — national, real bands fetched live from the VOA</li>
        </ul>
      </div>

      <div>
        <Label>Under the hood</Label>
        <ul className="space-y-2.5">
          <li className="flex gap-2.5">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent"><Icon name="zap" size={14} /></span>
            <span className="text-muted"><strong className="text-foreground">ClickHouse</strong> — primary database; comps, regressivity &amp; impact computed sub-second over millions of rows.</span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent"><Icon name="message" size={14} /></span>
            <span className="text-muted"><strong className="text-foreground">Trigger.dev</strong> — <code className="text-xs">chat.agent()</code> orchestration + a durable sub-task that runs the for-vs-against debate.</span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent"><Icon name="file" size={14} /></span>
            <span className="text-muted"><strong className="text-foreground">Postgres ⋈ ClickHouse</strong> — your saved appeals (OLTP) joined live to the analytics (OLAP).</span>
          </li>
        </ul>
      </div>

      <div>
        <Label>How it works</Label>
        <ol className="space-y-2">
          {["Type any address", "We compare it to real nearby sales", "Get a verdict, a map & a ready-to-file appeal"].map((t, i) => (
            <li key={t} className="flex gap-2.5 text-muted">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-fg">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
      </div>

      <p className="text-[11px] leading-relaxed text-muted">Estimates from public records — not tax or legal advice.</p>
    </div>
  );
}
