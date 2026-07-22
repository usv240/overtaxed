import { getAppealDossier } from "@/lib/queries";
import { buildAppealPdf } from "@/lib/appeal-pdf";

// GET /api/appeal?pin=...  → a filled, ready-to-file Cook County appeal PDF.
export async function GET(req: Request) {
  const pin = new URL(req.url).searchParams.get("pin");
  if (!pin) return new Response("Missing pin", { status: 400 });

  const dossier = await getAppealDossier(pin);
  if (!dossier) return new Response("No appeal data for that PIN", { status: 404 });

  const pdf = await buildAppealPdf(dossier);
  const safe = dossier.pin.replace(/[^\dA-Za-z]/g, "");
  return new Response(pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="Overtaxed-Appeal-${safe}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
