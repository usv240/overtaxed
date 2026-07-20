import { NextResponse } from "next/server";
import { fetchVoaBands, postcodeCentroid } from "@/lib/voa";

// Temporary: verify the live VOA lookup. GET /api/voa?postcode=E17 8HH
export async function GET(req: Request) {
  const pc = new URL(req.url).searchParams.get("postcode") || "E17 8HH";
  const [bands, centroid] = await Promise.all([fetchVoaBands(pc), postcodeCentroid(pc)]);
  return NextResponse.json({ postcode: pc, count: bands.length, sample: bands.slice(0, 6), centroid });
}
