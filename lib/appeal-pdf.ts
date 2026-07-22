import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { AppealDossier } from "./queries";

// Cook County brand-ish navy + a neutral grey; nothing external, pure vector PDF.
const NAVY = rgb(0.09, 0.13, 0.28);
const INK = rgb(0.12, 0.12, 0.14);
const MUTE = rgb(0.42, 0.45, 0.52);
const LINE = rgb(0.82, 0.84, 0.88);
const REDBG = rgb(0.98, 0.92, 0.92);
const RED = rgb(0.7, 0.12, 0.12);

const usd = (n: number | null | undefined) =>
  n == null ? "—" : `$${Math.round(n).toLocaleString("en-US")}`;

/**
 * Renders a filled, ready-to-file Cook County Board of Review residential
 * assessment appeal — cover + a lack-of-uniformity comparable-properties grid,
 * which is the exact evidence format the Board weighs. Returns PDF bytes.
 */
export async function buildAppealPdf(d: AppealDossier): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`Assessment Appeal — ${d.address}`);
  doc.setAuthor("Overtaxed");
  doc.setSubject("Residential Real Estate Assessed Valuation Complaint");

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([612, 792]); // US Letter
  const M = 54;
  const W = 612 - M * 2;
  let y = 792 - 56;

  const text = (
    s: string, x: number, yy: number,
    o: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb> } = {},
  ) => page.drawText(s, { x, y: yy, size: o.size ?? 10, font: o.font ?? font, color: o.color ?? INK });

  const ensure = (need: number) => {
    if (y - need < 60) { page = doc.addPage([612, 792]); y = 792 - 56; }
  };

  // ── Header band ──────────────────────────────────────────────────────────
  page.drawRectangle({ x: 0, y: 792 - 90, width: 612, height: 90, color: NAVY });
  text("ASSESSMENT APPEAL", M, 792 - 44, { size: 18, font: bold, color: rgb(1, 1, 1) });
  text("Cook County Board of Review — Residential Real Estate", M, 792 - 62, {
    size: 10, color: rgb(0.78, 0.82, 0.92),
  });
  text("Assessed Valuation Complaint (lack of uniformity)", M, 792 - 76, {
    size: 10, color: rgb(0.78, 0.82, 0.92),
  });
  y = 792 - 118;

  // ── Property / taxpayer block ────────────────────────────────────────────
  const row = (label: string, value: string, fill?: boolean) => {
    ensure(20);
    if (fill) page.drawRectangle({ x: M, y: y - 5, width: W, height: 20, color: rgb(0.96, 0.97, 0.99) });
    text(label, M + 4, y, { color: MUTE });
    text(value, M + 200, y, { font: bold });
    y -= 20;
  };
  text("SUBJECT PROPERTY", M, y, { size: 9, font: bold, color: NAVY });
  y -= 18;
  row("Property Index Number (PIN)", d.pin, true);
  row("Property address", d.address);
  row("Township / jurisdiction", d.region, true);
  row("Complaint date", d.filedOn);
  y -= 6;

  // ── The claim ────────────────────────────────────────────────────────────
  ensure(96);
  page.drawRectangle({ x: M, y: y - 74, width: W, height: 80, color: REDBG, borderColor: RED, borderWidth: 0.6 });
  text("GROUNDS FOR APPEAL", M + 10, y - 12, { size: 9, font: bold, color: RED });
  const claim = [
    `The Assessor's valuation implies a market value of ${usd(d.assessedMarketValue)}. Comparable arms-length`,
    `sales in the same neighbourhood support a market value of about ${usd(d.proposedMarketValue)}. The subject is`,
    `assessed at a ratio of ${d.yourRatio.toFixed(2)} of market value versus a neighbourhood median of ${d.medianRatio.toFixed(2)},`,
    `establishing a lack of uniformity under 35 ILCS 200/9-5 and the Illinois Constitution, Art. IX, Sec. 4.`,
  ];
  claim.forEach((l, i) => text(l, M + 10, y - 28 - i * 13, { size: 9.5 }));
  y -= 92;

  // ── Relief requested ─────────────────────────────────────────────────────
  ensure(56);
  text("RELIEF REQUESTED", M, y, { size: 9, font: bold, color: NAVY });
  y -= 18;
  const half = W / 2;
  const box = (x: number, label: string, value: string, color = INK) => {
    page.drawRectangle({ x, y: y - 30, width: half - 8, height: 40, borderColor: LINE, borderWidth: 0.8 });
    text(label, x + 8, y - 2, { size: 8, color: MUTE });
    text(value, x + 8, y - 20, { size: 15, font: bold, color });
  };
  box(M, "CURRENT (assessor's) market value", usd(d.assessedMarketValue));
  box(M + half + 8, "PROPOSED market value", usd(d.proposedMarketValue), rgb(0.11, 0.42, 0.22));
  y -= 44;
  ensure(16);
  text(`Estimated annual property-tax reduction if granted:`, M, y, { color: MUTE });
  text(usd(d.annualSaving), M + 262, y, { font: bold, color: rgb(0.11, 0.42, 0.22) });
  y -= 24;

  // ── Comparable-properties evidence grid ──────────────────────────────────
  ensure(40);
  text("EVIDENCE — COMPARABLE PROPERTIES", M, y, { size: 9, font: bold, color: NAVY });
  y -= 6;
  text("Nearby arms-length sales and their assessment ratios (assessed ÷ sale). Source: public records.", M, y - 8, {
    size: 8, color: MUTE,
  });
  y -= 22;

  const cols = [
    { h: "PIN", x: M + 2, w: 96, align: "l" as const },
    { h: "Address", x: M + 100, w: 150, align: "l" as const },
    { h: "Sale price", x: M + 252, w: 74, align: "r" as const },
    { h: "Sale date", x: M + 330, w: 62, align: "l" as const },
    { h: "Assessed", x: M + 396, w: 62, align: "r" as const },
    { h: "Ratio", x: M + 462, w: 40, align: "r" as const },
  ];
  const drawCell = (s: string, c: (typeof cols)[number], yy: number, f = font, color = INK) => {
    const size = 8.5;
    let x = c.x;
    if (c.align === "r") x = c.x + c.w - f.widthOfTextAtSize(s, size);
    page.drawText(s, { x, y: yy, size, font: f, color });
  };

  // header row
  page.drawRectangle({ x: M, y: y - 4, width: W, height: 18, color: NAVY });
  cols.forEach((c) => drawCell(c.h, c, y, bold, rgb(1, 1, 1)));
  y -= 20;

  d.comps.forEach((cp, i) => {
    ensure(18);
    if (i % 2 === 1) page.drawRectangle({ x: M, y: y - 4, width: W, height: 16, color: rgb(0.97, 0.98, 0.99) });
    const over = cp.ratio != null && cp.ratio < d.yourRatio; // comp taxed lighter than subject
    drawCell(cp.pin, cols[0], y);
    drawCell(cp.address.length > 26 ? cp.address.slice(0, 25) + "…" : cp.address, cols[1], y);
    drawCell(usd(cp.salePrice), cols[2], y);
    drawCell(cp.saleDate || "—", cols[3], y);
    drawCell(usd(cp.assessed), cols[4], y);
    drawCell(cp.ratio != null ? cp.ratio.toFixed(2) : "—", cols[5], y, bold, over ? RED : INK);
    y -= 16;
  });
  y -= 6;
  ensure(14);
  text(`Subject assessment ratio for comparison: ${d.yourRatio.toFixed(2)}  (neighbourhood median ${d.medianRatio.toFixed(2)})`, M, y, {
    size: 8.5, font: bold, color: RED,
  });
  y -= 28;

  // ── Signature ────────────────────────────────────────────────────────────
  ensure(70);
  drawSigLine(page, font, M, y, "Taxpayer signature");
  drawSigLine(page, font, M + half + 8, y, "Date");
  y -= 52;

  // ── Footer / instructions on every page ──────────────────────────────────
  const pages = doc.getPages();
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: 52 }, end: { x: 612 - M, y: 52 }, thickness: 0.6, color: LINE });
    p.drawText(
      "Prepared with Overtaxed · figures from public records, not tax or legal advice · file at cookcountyboardofreview.com",
      { x: M, y: 40, size: 7.5, font, color: MUTE },
    );
    p.drawText(`Page ${i + 1} of ${pages.length}`, { x: 612 - M - 54, y: 40, size: 7.5, font, color: MUTE });
  });

  return doc.save();
}

function drawSigLine(page: PDFPage, font: PDFFont, x: number, y: number, label: string) {
  page.drawLine({ start: { x, y }, end: { x: x + 210, y }, thickness: 0.8, color: rgb(0.3, 0.3, 0.34) });
  page.drawText(label, { x, y: y - 12, size: 8, font, color: MUTE });
}
