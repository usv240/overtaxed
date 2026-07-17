"use client";

import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Cell,
} from "recharts";
import type { VizSpec } from "@/lib/viz-catalog";

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
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              spec.appealStrength === "strong" ? "bg-red-100 text-red-700"
              : spec.appealStrength === "moderate" ? "bg-orange-100 text-orange-700"
              : "bg-neutral-100 text-neutral-600"}`}>
              appeal: {spec.appealStrength}
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
            {" "}· COD <strong>{spec.cod}</strong>
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
          {spec.caption && <p className="text-xs text-neutral-500">{spec.caption}</p>}
          <Badge ms={ms} rows={rows} />
        </Card>
      );
    }

    case "streetMap":
      // Full MapLibre map lands on Day 4; for now a ratio-coloured street list.
      return (
        <Card>
          <h4 className="font-semibold">Your street, by assessment ratio</h4>
          <div className="mt-2 grid grid-cols-1 gap-1">
            {[spec.subject, ...spec.neighbours].map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="inline-block h-3 w-3 rounded-full" style={{ background: ratioColor(p.ratio) }} />
                <span className={p.isSubject ? "font-semibold" : ""}>{p.address}</span>
                <span className="ml-auto text-neutral-500">{p.ratio != null ? p.ratio.toFixed(2) : "—"}{p.isSubject ? " ← you" : ""}</span>
              </div>
            ))}
          </div>
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
          {spec.filingUrl && <a href={spec.filingUrl} className="mt-2 inline-block text-sm text-blue-600 underline">File your appeal →</a>}
        </Card>
      );

    default:
      return null;
  }
}
