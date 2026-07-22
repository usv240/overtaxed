// Load real Band D council-tax amounts (gov.uk Table 7a: London boroughs,
// metropolitan districts and unitary authorities) into ClickHouse.
// Usage: node scripts/ingest-uk-band-d.mjs
import { readFileSync } from "node:fs";
import xlsx from "xlsx";

for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const HOST = process.env.CLICKHOUSE_HOST;
const AUTH = "Basic " + Buffer.from(`${process.env.CLICKHOUSE_USER}:${process.env.CLICKHOUSE_PASSWORD}`).toString("base64");

const URL_ODS = "https://assets.publishing.service.gov.uk/media/662a4da155e1582b6ca7e608/Table_7_24-25__revised_.ods";
const res = await fetch(URL_ODS);
const buf = Buffer.from(await res.arrayBuffer());
const wb = xlsx.read(buf, { type: "buffer" });

const rows = [];
for (const sheetName of ["Table_7a"]) {
  const grid = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });
  for (const r of grid) {
    const council = typeof r[2] === "string" ? r[2].trim() : "";
    const bandD = Number(r[6]);
    if (council && council !== "Authority" && bandD > 0) rows.push({ council, band_d: bandD, year: "2024-25" });
  }
}

const body =
  "INSERT INTO overtaxed.uk_band_d FORMAT JSONEachRow\n" +
  rows.map((r) => JSON.stringify(r)).join("\n");
const ins = await fetch(`${HOST}?async_insert=0`, { method: "POST", headers: { Authorization: AUTH }, body });
if (!ins.ok) throw new Error(await ins.text());
console.log(`inserted ${rows.length} authorities. samples:`, rows.filter((r) => /Wandsworth|Waltham Forest/.test(r.council)));
