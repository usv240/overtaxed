import { NextRequest, NextResponse } from "next/server";
import { getRegressivity } from "@/lib/queries";

// GET /api/regressivity?region=Cook County&priceMin=0&priceMax=99999999
// Powers the interactive slider — recomputes PRD/COD/impact live over ClickHouse.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const region = sp.get("region") || "Cook County";
  const priceMin = Number(sp.get("priceMin") ?? 20000);
  const priceMax = Number(sp.get("priceMax") ?? 100_000_000);
  const { spec, elapsedMs } = await getRegressivity(region, { priceMin, priceMax });
  return NextResponse.json({ spec, elapsedMs });
}
