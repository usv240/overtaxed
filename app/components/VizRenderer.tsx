"use client";

import { useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { fileAppealAction } from "@/app/portfolio-actions";
import { InfoTip } from "./InfoTip";
import { Icon } from "./Icon";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Cell, BarChart, Bar, LineChart, Line,
} from "recharts";
import type { VizSpec } from "@/lib/viz-catalog";

const StreetMapView = dynamic(() => import("./StreetMapView"), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse rounded-xl bg-surface-2" />,
});
const HeatmapView = dynamic(() => import("./HeatmapView"), {
  ssr: false,
  loading: () => <div className="h-96 w-full animate-pulse rounded-xl bg-surface-2" />,
});

/** Colour a parcel by how over/under-assessed it is (ratio vs 1.0). */
function ratioColor(ratio: number | null): string {
  if (ratio == null) return "#94a3b8";
  if (ratio >= 1.15) return "#dc2626"; // deep red = badly over-assessed
  if (ratio >= 1.05) return "#f97316"; // orange
  if (ratio >= 0.97) return "#22c55e"; // green = fair
  return "#3b82f6"; // blue = under-assessed
}

const money = (n: number, c: "USD" | "GBP" = "USD") =>
  new Intl.NumberFormat("en", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);

function Badge({ ms, rows }: { ms?: number; rows?: number }) {
  if (ms == null) return null;
  return (
    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs text-muted">
      <Icon name="zap" size={12} className="text-accent" /> {ms} ms{rows != null ? ` · ${rows.toLocaleString()} rows` : ""} · ClickHouse
      <InfoTip label="How fast?">
        The time our database took to crunch this answer across {rows != null ? `${rows.toLocaleString()} ` : "millions of "}
        real records. That&apos;s the speed that makes checking your whole street instant.
      </InfoTip>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="animate-fade-up my-3 rounded-2xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
      {children}
    </div>
  );
}

/** Plain-English summary. */
function Simple({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 flex gap-2 rounded-lg bg-accent-soft/60 px-3 py-2 text-sm leading-relaxed">
      <Icon name="message" size={16} className="mt-0.5 shrink-0 text-accent" />
      <p>{children}</p>
    </div>
  );
}

/** Collapsible "show the maths": the technical breakdown for anyone who wants it. */
function TechDetails({ rows, children }: { rows?: { label: string; value: string }[]; children?: React.ReactNode }) {
  if (!rows?.length && !children) return null;
  return (
    <details className="group mt-2 rounded-lg border border-border bg-surface-2/50 px-3 py-2">
      <summary className="flex cursor-pointer list-none items-center text-xs font-medium text-muted marker:content-none">
        <span className="mr-1 inline-block transition-transform group-open:rotate-90">▸</span>
        Show the maths
      </summary>
      {rows && (
        <dl className="mt-2 space-y-1 text-xs">
          {rows.map((r, i) => (
            <div key={i} className="flex justify-between gap-3 border-t border-border pt-1 first:border-0 first:pt-0">
              <dt className="text-muted">{r.label}</dt>
              <dd className="text-right font-medium tabular-nums">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {children && <div className="mt-2 text-xs leading-relaxed text-muted">{children}</div>}
    </details>
  );
}

export function VizRenderer({ spec, ms, rows }: { spec: VizSpec; ms?: number; rows?: number }) {
  switch (spec.kind) {
    case "verdictCard": {
      const over = spec.overpaymentPerPeriod > 0;
      return (
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className={`text-[11px] font-semibold uppercase tracking-widest ${over ? "text-neg/80" : "text-pos/80"}`}>
                {over ? "Verdict" : "Good news"}
              </div>
              <h3 className={`mt-1 text-[1.7rem] font-bold leading-tight tracking-tight ${over ? "text-neg" : "text-pos"}`}>
                {spec.headline}
              </h3>
            </div>
            <span className={`mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
              spec.appealStrength === "strong" ? "border-neg/20 bg-neg/10 text-neg"
              : spec.appealStrength === "moderate" ? "border-warn/20 bg-warn/10 text-warn"
              : "border-border bg-surface-2 text-muted"}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {spec.appealStrength} appeal
              <InfoTip label="Appeal strength">
                How likely a challenge is to succeed, based on how far your home&apos;s value sticks out from
                similar homes nearby. &quot;Strong&quot; means you have solid evidence to ask for a lower bill.
              </InfoTip>
            </span>
          </div>
          {spec.owedBack ? (
            <p className="mt-1.5 text-sm text-muted">
              Owed back: <strong className="text-foreground">{money(spec.owedBack, spec.currency)}</strong>
            </p>
          ) : null}
          {spec.simple ? <Simple>{spec.simple}</Simple> : spec.subtitle && <p className="mt-2 text-sm text-muted">{spec.subtitle}</p>}
          {spec.overpaymentPerPeriod > 0 && (
            <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-pos/20 bg-pos/10 px-3.5 py-2.5 text-sm font-semibold text-pos">
              <Icon name="check" size={16} className="shrink-0" />
              Reclaim about {money(spec.overpaymentPerPeriod, spec.currency)}/yr by appealing
              {spec.owedBack ? <>, plus {money(spec.owedBack, spec.currency)} backdated</> : null}.
            </div>
          )}
          <TechDetails rows={spec.technicalRows} />
          <p className="mt-2 text-xs text-muted">
            Confidence: {spec.confidence}
            <InfoTip label="Confidence">Based on how many recent comparable sales we found nearby. More comparables means higher confidence.</InfoTip>
            {" "}· estimate from public records, not tax advice
          </p>
          <Badge ms={ms} rows={rows} />
        </Card>
      );
    }

    case "compsTable":
      return (
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-semibold">Comparable sales near {spec.subjectAddress}</h4>
            {spec.fairValueEstimate != null && (
              <span className="text-sm text-muted">fair value ≈ {money(spec.fairValueEstimate)}</span>
            )}
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-muted">
              <tr><th className="py-1">Address</th><th>Sold</th><th>Date</th><th>Dist</th></tr>
            </thead>
            <tbody>
              {spec.comps.map((c, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="py-1">{c.address}</td>
                  <td>{money(c.salePrice)}</td>
                  <td className="text-muted">{c.saleDate}</td>
                  <td className="text-muted">{c.distanceMi} mi</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Badge ms={ms} rows={rows} />
        </Card>
      );

    case "regressivityScatter":
      return <RegressivityCard initial={spec} initialMs={ms} rows={rows} />;

    case "streetMap":
      return (
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-semibold">Your street, by assessment ratio</h4>
            <div className="flex items-center gap-2 text-[11px] text-muted">
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#dc2626" }} />over</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#22c55e" }} />fair</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#3b82f6" }} />under</span>
            </div>
          </div>
          <StreetMapView spec={spec} />
          <p className="mt-1 text-xs text-muted">{spec.legend} · your home is the large dot.</p>
          <Badge ms={ms} rows={rows} />
        </Card>
      );

    case "distributionStrip":
      return (
        <Card>
          <h4 className="font-semibold">{spec.label}</h4>
          <p className="text-sm text-muted">Your value: {spec.subjectValue}{spec.subjectPercentile != null ? ` (${spec.subjectPercentile}th percentile)` : ""}</p>
          <Badge ms={ms} rows={rows} />
        </Card>
      );

    case "appealPacket":
      return (
        <Card>
          <h4 className="font-semibold">Appeal packet: {spec.jurisdiction}</h4>
          <p className="text-sm text-muted">{spec.summary}</p>
          <dl className="mt-2 grid grid-cols-2 gap-1 text-sm">
            {spec.fields.map((f, i) => (
              <div key={i} className="contents"><dt className="text-muted">{f.label}</dt><dd>{f.value}</dd></div>
            ))}
          </dl>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {spec.pin && (
              <a
                href={`/api/appeal?pin=${encodeURIComponent(spec.pin)}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-fg shadow-sm transition-colors hover:bg-accent-hover"
              >
                <Icon name="file" size={15} /> Download filled appeal (PDF)
              </a>
            )}
            <FileAppealButton spec={spec} />
            {spec.filingUrl && <a href={spec.filingUrl} target="_blank" rel="noreferrer" className="text-sm text-accent underline underline-offset-2">official filing site</a>}
          </div>
          <p className="mt-2 text-[11px] text-muted">The PDF is a complete Board of Review residential complaint: grounds, proposed value, and a comparable-properties evidence grid, filled from live records.</p>
        </Card>
      );

    case "regressivityMap":
      return (
        <Card>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-semibold">The Tax Divide: {spec.region}, live</h4>
            <div className="flex items-center gap-1.5 text-[11px] text-muted">
              <span>under</span>
              <span className="h-2.5 w-24 rounded" style={{ background: "linear-gradient(90deg,#1e40af,#93c5fd,#fde68a,#f97316,#b91c1c)" }} />
              <span>over-assessed</span>
            </div>
          </div>
          <HeatmapView spec={spec} />
          {spec.caption && <p className="mt-1 text-xs text-muted">{spec.caption}</p>}
          <Simple>In plain terms: the red pockets are where the tax office values homes <em>above</em> what they actually sell for. Zoom in and click any area. This is computed live over every sold parcel, in ClickHouse.</Simple>
          <Badge ms={ms} rows={rows} />
        </Card>
      );

    case "fairnessLeaderboard": {
      const max = Math.max(...spec.areas.map((a) => a.prd), 1.1);
      return (
        <Card>
          <h4 className="font-semibold">Most unfairly-assessed areas in {spec.region}</h4>
          <p className="text-sm text-muted">
            Ranked by PRD
            <InfoTip label="PRD, the fairness score">Above 1.03 means cheaper homes are taxed at a higher rate than expensive ones. Higher means more unfair.</InfoTip>
            . Higher bars mean cheaper homes carry more of the burden.
          </p>
          <div className="mt-3 space-y-1.5">
            {spec.areas.map((a, i) => (
              <div key={a.name} className="flex items-center gap-2 text-sm">
                <span className="w-5 shrink-0 text-right text-xs text-muted">{i + 1}</span>
                <span className="w-24 shrink-0 truncate sm:w-32" title={a.name}>{a.name}</span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-surface-2">
                  <div className="h-full rounded" style={{ width: `${Math.min(100, ((a.prd - 0.95) / (max - 0.95)) * 100)}%`, background: a.prd > 1.03 ? "#dc2626" : "#22c55e" }} />
                </div>
                <span className="w-10 shrink-0 text-right font-semibold tabular-nums">{a.prd}</span>
              </div>
            ))}
          </div>
          {spec.caption && <Simple>{spec.caption}</Simple>}
          <Badge ms={ms} rows={rows} />
        </Card>
      );
    }

    case "appealDebate": {
      const file = spec.recommendation === "file";
      return (
        <Card>
          <div className="mb-2 flex items-center gap-1.5">
            <Icon name="message" size={16} className="text-accent" />
            <h4 className="font-semibold">Should you appeal? Two AI advocates debate it</h4>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-pos/25 bg-pos/5 p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-pos">For appealing</div>
              <p className="text-sm leading-relaxed">{spec.forCase}</p>
            </div>
            <div className="rounded-xl border border-warn/25 bg-warn/5 p-3">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-warn">Against</div>
              <p className="text-sm leading-relaxed">{spec.againstCase}</p>
            </div>
          </div>
          <div className={`mt-3 flex items-start gap-2 rounded-xl border p-3 ${file ? "border-pos/30 bg-pos/10" : "border-border bg-surface-2"}`}>
            <span className={`mt-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${file ? "bg-pos/20 text-pos" : "bg-surface-2 text-muted"}`}>
              {file ? "VERDICT: FILE IT" : "VERDICT: PROBABLY HOLD"}
            </span>
            <p className="text-sm leading-relaxed">{spec.rationale}</p>
          </div>
          <p className="mt-2 text-[11px] text-muted">Two Claude advocates argued this via a durable Trigger.dev sub-task.</p>
        </Card>
      );
    }

    case "dataResult":
      return <DataResultCard spec={spec} ms={ms} />;

    default:
      return null;
  }
}

/** Free-form answer: the agent wrote a live ClickHouse query; we show the chart, the table, and the SQL. */
function DataResultCard({ spec, ms }: { spec: Extract<VizSpec, { kind: "dataResult" }>; ms?: number }) {
  const fmtCell = (v: string | number | null) =>
    v == null ? "" : typeof v === "number" ? v.toLocaleString("en-US") : v;
  const chartData =
    spec.chart && spec.rows.length
      ? spec.rows.map((r) => ({
          x: String(r[spec.chart!.xIndex] ?? ""),
          y: Number(r[spec.chart!.yIndex] ?? 0),
        }))
      : [];
  const shown = spec.rows.slice(0, 12);

  return (
    <Card>
      <div className="mb-1 flex items-center gap-1.5">
        <Icon name="zap" size={16} className="text-accent" />
        <h4 className="font-semibold">Live from ClickHouse</h4>
      </div>
      {spec.caption && <p className="mb-2 text-sm text-muted">{spec.caption}</p>}

      {spec.chart && chartData.length > 0 && (
        <div className="mt-1 h-56 w-full">
          <ResponsiveContainer>
            {spec.chart.type === "line" ? (
              <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="x" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} width={52} tickFormatter={(v) => Number(v).toLocaleString()} />
                <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                <Line type="monotone" dataKey="y" stroke="var(--accent)" strokeWidth={2} dot={false} name={spec.columns[spec.chart.yIndex]} />
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="x" tick={{ fontSize: 11, fill: "var(--muted)" }} interval={0} angle={chartData.length > 6 ? -20 : 0} textAnchor={chartData.length > 6 ? "end" : "middle"} height={chartData.length > 6 ? 46 : 24} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted)" }} width={52} tickFormatter={(v) => Number(v).toLocaleString()} />
                <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                <Bar dataKey="y" fill="var(--accent)" radius={[4, 4, 0, 0]} name={spec.columns[spec.chart.yIndex]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-2 overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-2 text-left text-xs text-muted">
            <tr>{spec.columns.map((c) => <th key={c} className="whitespace-nowrap px-3 py-1.5 font-semibold">{c}</th>)}</tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={i} className="border-t border-border">
                {r.map((v, j) => <td key={j} className="whitespace-nowrap px-3 py-1.5 tabular-nums">{fmtCell(v)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {spec.rows.length > shown.length && (
        <p className="mt-1 text-[11px] text-muted">Showing {shown.length} of {spec.rows.length} rows.</p>
      )}

      <details className="group mt-2 rounded-lg border border-border bg-surface-2/50 px-3 py-2">
        <summary className="flex cursor-pointer list-none items-center text-xs font-medium text-muted marker:content-none">
          <span className="mr-1 inline-block transition-transform group-open:rotate-90">▸</span>
          View the ClickHouse query the agent wrote
        </summary>
        <pre className="mt-2 overflow-x-auto text-[11.5px] leading-relaxed text-foreground"><code>{spec.sql}</code></pre>
      </details>
      <Badge ms={ms} rows={spec.rows.length} />
    </Card>
  );
}

/** Files the appeal to Postgres (OLTP), then links to the portfolio. */
function FileAppealButton({ spec }: { spec: Extract<VizSpec, { kind: "appealPacket" }> }) {
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  if (done)
    return (
      <span className="text-sm text-pos">
        <Icon name="check" size={14} className="mr-1 inline text-pos" /> Filed and saved · <a href="/portfolio" className="underline underline-offset-2">view portfolio</a>
      </span>
    );
  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          await fileAppealAction({
            pin: spec.pin ?? null,
            address: spec.address ?? "",
            country: spec.country ?? "US",
            region: spec.region ?? null,
            jurisdiction: spec.jurisdiction,
            estimatedAnnualSaving: spec.estimatedAnnualSaving ?? 0,
          });
          setDone(true);
        })
      }
      className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-fg shadow-sm transition-colors hover:bg-accent-hover disabled:opacity-50"
    >
      {pending ? "Filing…" : "File this appeal"}
    </button>
  );
}

/** Interactive regressivity: a price slider that recomputes PRD/COD/impact live over ClickHouse. */
function RegressivityCard({
  initial, initialMs, rows,
}: { initial: Extract<VizSpec, { kind: "regressivityScatter" }>; initialMs?: number; rows?: number }) {
  const [spec, setSpec] = useState(initial);
  const [ms, setMs] = useState(initialMs);
  const [minPrice, setMinPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onSlide = (val: number) => {
    setMinPrice(val);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/regressivity?region=${encodeURIComponent(initial.region)}&priceMin=${val}`);
        const j = await res.json();
        if (j?.spec) { setSpec(j.spec); setMs(j.elapsedMs); }
      } catch { /* ignore */ } finally { setLoading(false); }
    }, 260);
  };

  const data = spec.points.map((p) => ({ ...p, ratioPct: p.ratio }));
  return (
    <Card>
      <h4 className="font-semibold">Is {spec.region} assessed fairly?</h4>
      <p className="text-sm text-muted">
        PRD <strong className={spec.prd > 1.03 ? "text-neg" : "text-pos"}>{spec.prd}</strong>
        <InfoTip label="PRD, the fairness score">
          Price-Related Differential. Above <strong>1.03</strong> means cheaper homes are taxed at a higher rate
          than expensive ones, so the system quietly favours the wealthy. The official measure assessors use.
        </InfoTip>
        {" "}· COD <strong>{spec.cod}</strong>
        <InfoTip label="COD, the consistency score">
          Coefficient of Dispersion: how much assessments bounce around for similar homes. Lower is fairer;
          assessors aim for under 15.
        </InfoTip>
        {spec.nParcels != null && <span className="text-muted"> · {spec.nParcels.toLocaleString()} parcels</span>}
        {spec.prd > 1.03 && <span className="ml-1 rounded bg-neg/10 px-1.5 py-0.5 text-xs text-neg">REGRESSIVE</span>}
      </p>

      {/* interactive explorer */}
      <div className="mt-2 rounded-lg border border-border bg-surface-2/50 px-3 py-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">Explore: only homes priced over <strong className="text-foreground">${(minPrice / 1000).toFixed(0)}k</strong></span>
          <span className="inline-flex items-center gap-1 text-muted">{loading && <Icon name="zap" size={12} className="animate-pulse text-accent" />}{loading ? "recomputing…" : "live"}</span>
        </div>
        <input
          type="range" min={0} max={1_000_000} step={25_000} value={minPrice}
          onChange={(e) => onSlide(Number(e.target.value))}
          className="mt-1.5 w-full accent-[var(--accent)]"
          aria-label="Minimum home price"
        />
        <p className="text-[11px] text-muted">Drag up to watch the unfairness shrink among pricier homes. Each move recomputes over ClickHouse.</p>
      </div>

      <div className="mt-2 h-64 w-full">
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis type="number" dataKey="salePrice" name="Sale price" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} fontSize={11} />
            <YAxis type="number" dataKey="ratioPct" name="Assessment ratio" domain={["auto", "auto"]} fontSize={11} />
            <ReferenceLine y={1} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "fair", fontSize: 10 }} />
            <Tooltip formatter={(v, n) => (n === "Sale price" ? money(Number(v)) : Number(v).toFixed(3))} />
            <Scatter data={data} name="Homes">
              {data.map((d, i) => <Cell key={i} fill={ratioColor(d.ratio)} />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {spec.quintiles && spec.quintiles.length > 0 && (
        <div className="mt-1 flex items-end gap-1">
          {spec.quintiles.map((q) => (
            <div key={q.quintile} className="flex-1 text-center">
              <div className="flex h-14 items-end">
                <div className="w-full rounded-t" style={{ height: `${Math.min(100, q.avgRatio * 80)}%`, background: ratioColor(q.avgRatio) }} />
              </div>
              <div className="text-[10px] text-muted">${(q.avgPrice / 1000).toFixed(0)}k</div>
              <div className="text-[10px] font-semibold">{q.avgRatio}×</div>
            </div>
          ))}
        </div>
      )}

      {spec.simple && <Simple>{spec.simple}</Simple>}
      {spec.impact && (
        <div className="mt-3 rounded-xl border border-neg/25 bg-neg/5 p-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-neg">
            <Icon name="target" size={16} /> The human cost
          </div>
          <p className="mt-1.5 text-sm leading-relaxed">
            <strong>{spec.impact.overAssessedPct}%</strong> of homes here are over-assessed versus a fair system.
            Lower-value homeowners overpay about <strong>{money(spec.impact.excessTaxBelowMeasured)}</strong> a year,
            and that&apos;s only from the {spec.impact.soldSample.toLocaleString()} homes sold last year.
            The typical over-assessed lower-value home pays <strong>{money(spec.impact.avgOverpayBelow)}</strong> too much.
          </p>
          {spec.impact.totalParcels && (
            <p className="mt-1.5 text-[11px] text-muted">
              Extrapolated to all {spec.impact.totalParcels.toLocaleString()} parcels: an estimated{" "}
              <strong className="text-neg">{money(spec.impact.estCountyAnnual)}/yr</strong>{" "}
              (measured excess × {(spec.impact.totalParcels / spec.impact.soldSample).toFixed(0)}, assuming sold homes are representative).
            </p>
          )}
        </div>
      )}

      <TechDetails
        rows={[
          { label: "PRD (Price-Related Differential)", value: `${spec.prd}  (fair ≤ 1.03)` },
          { label: "COD (Coefficient of Dispersion)", value: `${spec.cod}  (assessors aim < 15)` },
          { label: "Parcels analysed", value: (spec.nParcels ?? 0).toLocaleString() },
        ]}
      >
        PRD is the mean assessment ratio divided by the sale-weighted mean ratio; above 1.03 signals regressivity.
        COD is the average percent deviation of ratios from the median. Both are the standard IAAO uniformity
        metrics, computed live over every sold parcel, and re-computed each time you move the slider.
      </TechDetails>
      <Badge ms={ms} rows={rows ?? spec.nParcels} />
    </Card>
  );
}
