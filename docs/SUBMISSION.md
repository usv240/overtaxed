# Submission — copy-paste ready

## Links
- **Live demo:** https://overtaxed-ujwal-s-projects5.vercel.app
- **Public repo (MIT):** https://github.com/usv240/overtaxed
- **Demo video:** _<YouTube link — add after upload>_

## Project Title (≤100 chars)
Overtaxed — see if you're overpaying property tax, with the proof

## Project Tagline (≤160 chars)
Ask if you're overtaxed on your home; get a map, a fairness chart and a ready-to-file appeal — not a wall of text. US + UK, on live public data.

## Solution Summary (≤500 words)
**The problem.** 30–60% of US homes are assessed too high, and 400,000+ UK homes sit in the wrong council-tax band — yet fewer than 1 in 20 people ever check, and a successful challenge saves $1,000–3,000 (or £1,000s) a year. The records are public, but no one can *query* them. And this is the perfect "beyond the wall of text" problem: whether your home is over-taxed is a **map and a distribution**, never a paragraph.

**Overtaxed** is a chat agent where the answer *is* the product. Type your address and, instead of prose, you get: a one-line **verdict** ("overpaying ~$3,793/yr — reclaim it"), a **street map** with your home glowing red against neighbours coloured by assessment ratio, a live **comps table**, and a **downloadable, ready-to-file appeal PDF** — a complete Cook County Board of Review complaint with the legal grounds and a comparable-properties evidence grid, filled from live records. Ask "show me the Tax Divide" and you get an **explorable live heatmap** of over-assessment across the whole county — 1.6M parcels aggregated into ~1,800 map cells by a single ClickHouse spatial query, zoomable and clickable. Ask "is my county fair?" and you get the **regressivity exposé** — the IAAO metrics **PRD & COD** computed live over 60k+ parcels — with an interactive **price slider** that recomputes over ClickHouse as you drag, and a quantified **"human cost"** ($460M/yr shifted onto lower-value Cook County homeowners). Ask "which neighbourhoods are worst?" and you get a **fairness leaderboard** ranking townships by unfairness. For any over-assessment, two AI advocates **debate whether to appeal** (a durable Trigger.dev sub-task) before a verdict.

**Real data, at scale, two countries.** ClickHouse holds ~1.6M Cook County parcels + assessments, ~456k Allegheny (Pittsburgh) assessments, and **6.06M UK Land Registry sales** — all ingested with zero-ETL `url()`. UK council-tax bands (which aren't published in bulk) are fetched **live from the VOA** per postcode and cached. Everything is computed live and sub-second; the UI shows the query latency to prove it.

**Both tools are load-bearing.** ClickHouse is the primary database and the star — `geoDistance` comps, PRD/COD regressivity, dollar-impact, a `postgresql()` OLTP+OLAP federation, and an `AggregatingMergeTree` materialized view. Trigger.dev's `chat.agent()` orchestrates everything, with durable ingestion tasks, the debate **sub-task**, and a **scheduled** "watch my home" task.

**Honest by design.** Every figure is computed from public records (not tax advice); jargon has plain-English tooltips and an opt-in "show the maths"; the extrapolation method and all reference figures are documented at `/methodology`.

It's free, it takes 10 seconds, and it hands a real person real money back — in two countries, on real data.

## How ClickHouse & Trigger.dev are each used (brief)
- **ClickHouse (primary DB):** all analytics — `geoDistance` comparable sales, IAAO sales-ratio science (PRD/COD), quantified regressivity impact, a live interactive slider, an `AggregatingMergeTree` **materialized view** (`latest_sales`), **zero-ETL `url()`** ingestion of government CSVs, and a **`postgresql()` federation** joining Postgres OLTP to the OLAP tables. Sub-second over millions of rows.
- **Trigger.dev (orchestration):** `chat.agent()` drives the whole conversation; **durable ingestion tasks** stream Cook County, Allegheny and 6M UK Land Registry rows; a **durable sub-task** runs the two-advocate appeal debate; a **scheduled (cron) task** re-checks saved properties (OLTP→OLAP→OLTP).

## Bonus category — best OLTP + OLAP integration
ClickHouse Cloud **Postgres** (OLTP: saved properties + appeals) is joined **live** to the ClickHouse (OLAP) analytics in a single query via the `postgresql()` table function — one vendor, one statement.

---

## Demo video
The full shot-by-shot script (≤5 min, rubric-optimised) lives in **[`docs/VIDEO-SCRIPT.md`](VIDEO-SCRIPT.md)**. In one breath: address → $3,793 verdict → street map (⚡199ms ClickHouse) → for-vs-against debate (durable Trigger sub-task) → download the appeal PDF → **the Tax Divide heatmap** → the live PRD/COD slider → UK band check → "under the hood" (ClickHouse primary + Trigger `chat.agent()`) → $460M impact. Open directly on a screen recording; no intro.
