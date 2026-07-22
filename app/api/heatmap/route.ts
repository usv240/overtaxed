import { NextResponse } from "next/server";
import { getRegressivityMap } from "@/lib/queries";

export async function GET() {
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const { spec, elapsedMs } = await getRegressivityMap("Cook County");
  return NextResponse.json({ cells: spec.cells.length, center: spec.center, ms: elapsedMs, caption: spec.caption, sample: spec.cells.slice(0, 4) });
}
