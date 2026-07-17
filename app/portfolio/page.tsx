import Link from "next/link";
import { getPortfolio, getAppeals } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

const money = (n: number | null, c = "USD") =>
  n == null ? "—" : new Intl.NumberFormat("en", { style: "currency", currency: c, maximumFractionDigits: 0 }).format(n);

function ratioColor(r: number | null) {
  if (r == null) return "#94a3b8";
  if (r >= 1.15) return "#dc2626";
  if (r >= 1.05) return "#f97316";
  if (r >= 0.97) return "#22c55e";
  return "#3b82f6";
}

const statusStyle: Record<string, string> = {
  filed: "bg-blue-100 text-blue-700",
  won: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  draft: "bg-neutral-100 text-neutral-600",
};

export default async function PortfolioPage() {
  const [{ rows, elapsedMs }, appeals] = await Promise.all([getPortfolio(), getAppeals()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Portfolio</h1>
        <Link href="/app" className="text-sm text-blue-600 underline">← back to chat</Link>
      </div>
      <p className="mb-6 text-sm text-neutral-500">
        Your saved homes live in <strong>Postgres (OLTP)</strong>; each row is enriched live by a single{" "}
        <strong>ClickHouse (OLAP)</strong> query that federates Postgres via <code>postgresql()</code> and joins the
        assessment + sales tables. <span className="text-neutral-400">⚡ {elapsedMs} ms</span>
      </p>

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-neutral-400">Saved properties (OLTP ⋈ OLAP)</h2>
      <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-black/[.03] text-left text-neutral-500 dark:bg-white/5">
            <tr><th className="p-2">Address</th><th>Assessed</th><th>Recent sale</th><th>Ratio</th></tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={4} className="p-4 text-center text-neutral-400">No saved properties yet — file an appeal from the chat.</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-black/5 dark:border-white/5">
                <td className="p-2">{r.address}</td>
                <td>{money(r.assessed, r.country === "UK" ? "GBP" : "USD")}</td>
                <td>{money(r.recentSale, r.country === "UK" ? "GBP" : "USD")}</td>
                <td>
                  {r.ratio != null && <span className="inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: ratioColor(r.ratio) }} />}{" "}
                  {r.ratio ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold uppercase tracking-wide text-neutral-400">Appeals (OLTP status)</h2>
      <div className="space-y-2">
        {appeals.length === 0 && <p className="text-sm text-neutral-400">No appeals filed yet.</p>}
        {appeals.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-xl border border-black/10 p-3 dark:border-white/10">
            <div>
              <div className="font-medium">{a.address}</div>
              <div className="text-xs text-neutral-500">{a.jurisdiction} · est. saving {money(a.estimated_annual_saving)}/yr</div>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[a.status] ?? statusStyle.draft}`}>{a.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
