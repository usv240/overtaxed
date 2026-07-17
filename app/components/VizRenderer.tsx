"use client";

import { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { fileAppealAction } from "@/app/portfolio-actions";
import { InfoTip } from "./InfoTip";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Cell,
} from "recharts";
import type { VizSpec } from "@/lib/viz-catalog";

const StreetMapView = dynamic(() => import("./StreetMapView"), {
  ssr: false,
  loading: () => <div className="h-72 w-full animate-pulse rounded-xl bg-black/5 dark:bg-white/10" />,
});

/** Colour a parcel by how over/under-assessed it is (ratio vs 1.0). */
function ratioColor(ratio: number | null): string {
  if (ratio == null) return "#94a3b8";
  if (ratio >= 1.15) return "#dc2626"; // deep red — badly over-assessed
  if (ratio >= 1.05) return "#f97316"; // orange
  if (ratio >= 0.97) return "#22c55e"; // green — fair
  return "#3b82f6"; // blue — under-assessed
}

const money = (n: number, c: "USD" | "GBP" = "USD") =>
  new Intl.NumberFormat("en", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);

function Badge({ ms, rows }: { ms?: number; rows?: number }) {
  if (ms == null) return null;
  return (
    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-xs text-neutral-500 dark:bg-white/10">
      ⚡ {ms} ms{rows != null ? ` · ${rows.toLocaleString()} rows` : ""} · ClickHouse
      <InfoTip label="How fast?">
        The time our database took to crunch this answer across {rows != null ? `${rows.toLocaleString()} ` : "millions of "}
        real records. That&apos;s the speed that makes checking your whole street instant.
      </InfoTip>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-3 rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-neutral-900">
      {children}
    </div>
  );
}

export function VizRenderer({ spec, ms, rows }: { spec: VizSpec; ms?: number; rows?: number }) {
  switch (spec.kind) {
    case "verdictCard": {
      const over = spec.overpaymentPerPeriod > 0;
      return (
        <Card>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className={`text-2xl font-bold ${over ? "text-red-600" : "text-green-600"}`}>
              {spec.headline}
            </h3>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              spec.appealStrength === "strong" ? "bg-red-100 text-red-700"
              : spec.appealStrength === "moderate" ? "bg-orange-100 text-orange-700"
              : "bg-neutral-100 text-neutral-600"}`}>
              appeal: {spec.appealStrength}
              <InfoTip label="Appeal strength">
                How likely a challenge is to succeed, based on how far your home&apos;s value sticks out from
                similar homes nearby. &quot;Strong&quot; means you have solid evidence to ask for a lower bill.
              </InfoTip>
            </span>
          </div>
          {spec.owedBack ? (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
              Owed back: <strong>{money(spec.owedBack, spec.currency)}</strong>
            </p>
          ) : null}
          {spec.subtitle && <p className="mt-2 text-sm text-neutral-500">{spec.subtitle}</p>}
          <p className="mt-2 text-xs text-neutral-400">Confidence: {spec.confidence} · estimate from public records, not tax advice</p>
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
              <span className="text-sm text-neutral-500">fair value ≈ {money(spec.fairValueEstimate)}</span>
            )}
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-400">
              <tr><th className="py-1">Address</th><th>Sold</th><th>Date</th><th>Dist</th></tr>
            </thead>
            <tbody>
              {spec.comps.map((c, i) => (
                <tr key={i} className="border-t border-black/5 dark:border-white/5">
                  <td className="py-1">{c.address}</td>
                  <td>{money(c.salePrice)}</td>
                  <td className="text-neutral-500">{c.saleDate}</td>
                  <td className="text-neutral-500">{c.distanceMi} mi</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Badge ms={ms} rows={rows} />
        </Card>
      );

    case "regressivityScatter": {
      const data = spec.points.map((p) => ({ ...p, ratioPct: p.ratio }));
      return (
        <Card>
          <h4 className="font-semibold">Is {spec.region} assessed fairly?</h4>
          <p className="text-sm text-neutral-500">
            PRD <strong className={spec.prd > 1.03 ? "text-red-600" : "text-green-600"}>{spec.prd}</strong>
            <InfoTip label="PRD — the fairness score">
              Price-Related Differential. Above <strong>1.03</strong> means cheaper homes are taxed at a higher
              rate than expensive ones — i.e. the system quietly favours the wealthy. The official measure
              assessors use.
            </InfoTip>
            {" "}· COD <strong>{spec.cod}</strong>
            <InfoTip label="COD — the consistency score">
              Coefficient of Dispersion. How much assessments bounce around for similar homes — lower is fairer.
              Assessors aim for under 15.
            </InfoTip>
            {spec.nParcels != null && <span className="text-neutral-400"> · {spec.nParcels.toLocaleString()} parcels</span>}
            {spec.prd > 1.03 && <span className="ml-1 rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">REGRESSIVE</span>}
          </p>
          <div className="mt-2 h-64 w-full">
            <ResponsiveContainer>
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" dataKey="salePrice" name="Sale price"
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} fontSize={11} />
                <YAxis type="number" dataKey="ratioPct" name="Assessment ratio"
                  domain={["auto", "auto"]} fontSize={11} />
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
                  <div className="text-[10px] text-neutral-400">${(q.avgPrice / 1000).toFixed(0)}k</div>
                  <div className="text-[10px] font-semibold">{q.avgRatio}×</div>
                </div>
              ))}
            </div>
          )}
          {spec.caption && <p className="mt-1 text-xs text-neutral-500">{spec.caption}</p>}
          <Badge ms={ms} rows={rows} />
        </Card>
      );
    }

    case "streetMap":
      return (
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-semibold">Your street, by assessment ratio</h4>
            <div className="flex items-center gap-2 text-[11px] text-neutral-500">
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#dc2626" }} />over</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#22c55e" }} />fair</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#3b82f6" }} />under</span>
            </div>
          </div>
          <StreetMapView spec={spec} />
          <p className="mt-1 text-xs text-neutral-500">{spec.legend} · your home is the large dot.</p>
          <Badge ms={ms} rows={rows} />
        </Card>
      );

    case "distributionStrip":
      return (
        <Card>
          <h4 className="font-semibold">{spec.label}</h4>
          <p className="text-sm text-neutral-500">Your value: {spec.subjectValue}{spec.subjectPercentile != null ? ` (${spec.subjectPercentile}th percentile)` : ""}</p>
          <Badge ms={ms} rows={rows} />
        </Card>
      );

    case "appealPacket":
      return (
        <Card>
          <h4 className="font-semibold">Appeal packet — {spec.jurisdiction}</h4>
          <p className="text-sm text-neutral-500">{spec.summary}</p>
          <dl className="mt-2 grid grid-cols-2 gap-1 text-sm">
            {spec.fields.map((f, i) => (
              <div key={i} className="contents"><dt className="text-neutral-400">{f.label}</dt><dd>{f.value}</dd></div>
            ))}
          </dl>
          <div className="mt-3 flex items-center gap-3">
            <FileAppealButton spec={spec} />
            {spec.filingUrl && <a href={spec.filingUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">official filing site →</a>}
          </div>
        </Card>
      );

    default:
      return null;
  }
}

/** Files the appeal to Postgres (OLTP), then links to the portfolio. */
function FileAppealButton({ spec }: { spec: Extract<VizSpec, { kind: "appealPacket" }> }) {
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  if (done)
    return (
      <span className="text-sm text-green-600">
        ✓ Filed &amp; saved · <a href="/portfolio" className="underline">view portfolio →</a>
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
      className="rounded-full bg-blue-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
    >
      {pending ? "Filing…" : "File this appeal"}
    </button>
  );
}
