import { Icon } from "./Icon";

export type Stats = {
  ukSales: number;
  cookParcels: number;
  allegheny: number;
  impactAnnual: number;
  nationalAnnual: number;
};

const compact = (n: number) => Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
const usd = (n: number) => "$" + compact(n);

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">{children}</div>;
}

/** Persistent context sidebar: always-visible substance so the app never feels empty. */
export function ContextPanel({ stats }: { stats: Stats }) {
  return (
    <div className="flex min-h-full flex-col gap-5 p-4 text-sm">
      <div>
        <Label>Live data in ClickHouse</Label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { n: compact(stats.ukSales), l: "UK sales (Land Registry)" },
            { n: compact(stats.cookParcels), l: "Cook County parcels" },
            { n: compact(stats.allegheny), l: "Allegheny assessments" },
            { n: usd(stats.impactAnnual), l: "Est. yearly harm, Cook Co." },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-border bg-surface p-2.5">
              <div className="text-base font-bold tracking-tight text-accent tabular-nums">{s.n}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-muted">{s.l}</div>
            </div>
          ))}
        </div>
        <a href="/methodology" className="mt-2 block rounded-xl border border-accent/30 bg-accent-soft p-2.5 transition-colors hover:border-accent/50">
          <div className="text-base font-bold tracking-tight text-accent tabular-nums">~{usd(stats.nationalAnnual)}/yr</div>
          <div className="mt-0.5 text-[11px] leading-snug text-muted">
            projected US-wide, the same regressivity national studies document. <span className="underline">See the maths.</span>
          </div>
        </a>
      </div>

      <div>
        <Label>Coverage</Label>
        <ul className="space-y-1 text-[13px] text-muted">
          <li className="flex gap-2"><Icon name="check" size={14} className="mt-0.5 shrink-0 text-pos" /> US: Cook County (Chicago) and Allegheny (Pittsburgh)</li>
          <li className="flex gap-2"><Icon name="check" size={14} className="mt-0.5 shrink-0 text-pos" /> UK: national, live from the VOA</li>
        </ul>
      </div>

      <div>
        <Label>Under the hood</Label>
        <ul className="space-y-2">
          <li className="flex gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent"><Icon name="zap" size={12} /></span>
            <span className="text-[13px] leading-snug text-muted"><strong className="text-foreground">ClickHouse</strong> primary DB: comps, regressivity and impact, sub-second over millions of rows.</span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent"><Icon name="message" size={12} /></span>
            <span className="text-[13px] leading-snug text-muted"><strong className="text-foreground">Trigger.dev</strong> <code className="text-xs">chat.agent()</code> plus a durable sub-task for the debate.</span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent"><Icon name="file" size={12} /></span>
            <span className="text-[13px] leading-snug text-muted"><strong className="text-foreground">Postgres + ClickHouse</strong>: saved appeals (OLTP) joined live to analytics (OLAP).</span>
          </li>
        </ul>
      </div>

      <p className="mt-auto pt-2 text-[11px] leading-relaxed text-muted">Estimates from public records. Not tax or legal advice.</p>
    </div>
  );
}
