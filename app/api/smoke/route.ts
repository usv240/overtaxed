import { NextResponse } from "next/server";
import { findProperty, analyzeProperty, getRegressivity, getStreetMap, generateAppealPacket, checkUkBand } from "@/lib/queries";

// Temporary end-to-end smoke test of the query layer through @clickhouse/client.
// GET /api/smoke  → runs the same functions the agent tools call.
export async function GET() {
  const found = await findProperty("3212 N Racine");
  const pin = found.candidates[0]?.pin;
  const analysis = pin ? await analyzeProperty(pin) : null;
  const street = pin ? await getStreetMap(pin) : null;
  const appeal = pin ? await generateAppealPacket(pin) : null;
  const regressivity = await getRegressivity("Cook County");
  const uk = await checkUkBand("12 Lavender Sweep");

  return NextResponse.json({
    findProperty: { count: found.candidates.length, first: found.candidates[0], ms: found.elapsedMs },
    analyze: analysis && {
      headline: analysis.verdict?.headline,
      appealStrength: analysis.verdict?.appealStrength,
      annualOverpay: analysis.meta?.annualOverpay,
      comps: analysis.comps?.comps.length,
      ms: analysis.elapsedMs,
    },
    streetMap: street?.spec && { neighbours: street.spec.neighbours.length, ms: street.elapsedMs },
    appeal: appeal?.spec && { jurisdiction: appeal.spec.jurisdiction, fields: appeal.spec.fields.length, filingUrl: appeal.spec.filingUrl },
    regressivity: {
      prd: regressivity.spec.prd,
      cod: regressivity.spec.cod,
      points: regressivity.spec.points.length,
      caption: regressivity.spec.caption,
      ms: regressivity.elapsedMs,
    },
    uk: uk.found && {
      headline: uk.verdict?.headline,
      owedBack: uk.verdict?.owedBack,
      appeal: uk.verdict?.appealStrength,
      subtitle: uk.verdict?.subtitle,
      neighbours: uk.street?.neighbours.length,
      ms: uk.elapsedMs,
    },
  });
}
