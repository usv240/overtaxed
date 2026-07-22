import { Chat } from "@/app/components/Chat";
import { query } from "@/lib/clickhouse";
import { getRegressivity } from "@/lib/queries";
import { projectUsAnnual } from "@/lib/impact";

export const revalidate = 600;

async function getStats() {
  const fallback = { ukSales: 6060000, cookParcels: 1590000, allegheny: 456000, impactAnnual: 460000000 };
  try {
    const { rows } = await query<{ ukSales: string; cookParcels: string; allegheny: string }>(`
      SELECT
        (SELECT count() FROM overtaxed.sales WHERE country='UK') AS ukSales,
        (SELECT count() FROM overtaxed.parcels) AS cookParcels,
        (SELECT count() FROM overtaxed.assessments WHERE region='Allegheny County') AS allegheny`);
    const r = rows[0];
    let impactAnnual = fallback.impactAnnual;
    try { impactAnnual = (await getRegressivity("Cook County")).spec.impact?.estCountyAnnual ?? fallback.impactAnnual; } catch {}
    return {
      ukSales: Number(r?.ukSales ?? 0),
      cookParcels: Number(r?.cookParcels ?? 0),
      allegheny: Number(r?.allegheny ?? 0),
      impactAnnual,
      nationalAnnual: projectUsAnnual(impactAnnual),
    };
  } catch {
    return { ...fallback, nationalAnnual: projectUsAnnual(fallback.impactAnnual) };
  }
}

export default async function AppPage() {
  const stats = await getStats();
  return <Chat stats={stats} />;
}
