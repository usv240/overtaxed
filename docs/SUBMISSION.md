# Submission — copy-paste ready

## Project Title (≤100 chars)
Overtaxed — see if you're overpaying property tax, with the proof

## Project Tagline (≤160 chars)
Ask if you're overtaxed on your home; get a map, a fairness chart and a ready-to-file appeal — not a wall of text. US + UK, on live public data.

## Solution Summary (≤500 words)
**The problem.** 30–60% of US homes are assessed too high, and 400,000+ UK homes sit in the wrong council-tax band — yet fewer than 1 in 20 people ever check, and a successful challenge saves $1,000–3,000 (or £1,000s) a year. The records are public, but no one can *query* them. And this is the perfect "beyond the wall of text" problem: whether your home is over-taxed is a **map and a distribution**, never a paragraph.

**Overtaxed** is a chat agent where the answer *is* the product. Type your address and, instead of prose, you get: a one-line **verdict** ("overpaying ~$3,793/yr — reclaim it"), a **street map** with your home glowing red against neighbours coloured by assessment ratio, a live **comps table**, and a **pre-filled appeal** with the real filing link. Ask "is my county fair?" and you get the **regressivity exposé** — the IAAO metrics **PRD & COD** computed live over 60k+ parcels — with an interactive **price slider** that recomputes over ClickHouse as you drag, and a quantified **"human cost"** ($460M/yr shifted onto lower-value Cook County homeowners). Ask "which neighbourhoods are worst?" and you get a **fairness leaderboard** ranking townships by unfairness (Hyde Park, PRD 1.18). For any over-assessment, two AI advocates **debate whether to appeal** (a durable Trigger.dev sub-task) before a verdict.

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

## Demo video shot-list (3–5 min, open on a live screen recording — no intro)
1. **(0:00–0:20)** Landing → "Check my home". One line: "30–60% of homes are overtaxed; nobody checks; the answer should be a picture."
2. **(0:20–1:30)** Type **4317 N Monticello Ave, Chicago** → verdict ("overpaying $3,793/yr, reclaim it") → comps → **real map** (your home red) → the **debate** streams in (For/Against + FILE IT) → **file appeal** → **My Portfolio** (Postgres⋈ClickHouse federation, live ms).
3. **(1:30–2:30)** "Is Cook County fair?" → regressivity scatter + quintile bars + **REGRESSIVE** + the **$460M human cost** → **drag the slider** (PRD recomputes live) → "which areas are worst?" → **leaderboard** (Hyde Park 1.18).
4. **(2:30–3:20)** "Check E17 8HH" (or 12 Lavender Sweep) → **live VOA** band result. Then show the **Trigger.dev dashboard**: ingestion runs, the debate sub-task, the scheduled watch task.
5. **(3:20–4:00)** Architecture in one breath: ClickHouse primary (url() ingest, MV, federation, sub-second) + Trigger chat.agent() (tasks, sub-task, cron). Close on the impact line + /methodology (honest).
