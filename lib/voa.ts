/**
 * LIVE UK council-tax band lookup.
 *
 * The VOA does not publish per-property bands in bulk, so we fetch them on
 * demand from the public "Check your Council Tax band" service (CSRF + session),
 * parse the results table, and cache into ClickHouse. Real bands, live.
 */
const BASE = "https://www.tax.service.gov.uk/check-council-tax-band";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

export type VoaBand = { address: string; band: string; council: string };

const strip = (s: string) => s.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

/** Fetch real council-tax bands for every property in a postcode. */
export async function fetchVoaBands(postcode: string): Promise<VoaBand[]> {
  // 1) GET the form → session cookie + CSRF token
  const g = await fetch(`${BASE}/search`, { headers: { "User-Agent": UA } });
  const formHtml = await g.text();
  const cookie = (g.headers.get("set-cookie") || "").split(",").map((c) => c.split(";")[0].trim()).join("; ");
  const csrf = formHtml.match(/name="csrfToken"[^>]*value="([^"]+)"/)?.[1];
  if (!csrf) return [];

  // 2) POST the postcode
  let r = await fetch(`${BASE}/search`, {
    method: "POST",
    headers: {
      "User-Agent": UA,
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookie,
    },
    body: new URLSearchParams({ csrfToken: csrf, postcode }),
    redirect: "manual",
  });
  // follow a redirect manually, carrying the cookie
  const loc = r.headers.get("location");
  if (loc) {
    const url = loc.startsWith("http") ? loc : `https://www.tax.service.gov.uk${loc}`;
    r = await fetch(url, { headers: { "User-Agent": UA, Cookie: cookie } });
  }
  const html = await r.text();

  // 3) parse the results table: address | band | council
  const out: VoaBand[] = [];
  for (const row of html.match(/<tr class="govuk-table__row">[\s\S]*?<\/tr>/g) || []) {
    const cells = row.match(/<td[^>]*>[\s\S]*?<\/td>/g) || [];
    if (cells.length < 3) continue;
    const address = strip(cells[0] ?? "");
    const band = strip(cells[1] ?? "");
    const council = strip(cells[2] ?? "");
    if (/^[A-H]$/.test(band) && address) out.push({ address, band, council });
  }
  return out;
}

/** Free postcode → lat/lng centroid (postcodes.io, no key). */
export async function postcodeCentroid(postcode: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const r = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
    if (!r.ok) return null;
    const j = (await r.json()) as { result?: { latitude: number; longitude: number } };
    if (!j.result) return null;
    return { lat: j.result.latitude, lng: j.result.longitude };
  } catch {
    return null;
  }
}
