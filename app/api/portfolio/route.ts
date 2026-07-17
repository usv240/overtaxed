import { NextResponse } from "next/server";
import { getPortfolio, getAppeals } from "@/lib/portfolio";

// GET /api/portfolio — federated OLTP+OLAP portfolio + appeal statuses.
export async function GET() {
  const [portfolio, appeals] = await Promise.all([getPortfolio(), getAppeals()]);
  return NextResponse.json({
    portfolio: portfolio.rows,
    portfolioMs: portfolio.elapsedMs,
    appeals,
  });
}
