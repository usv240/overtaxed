# Overtaxed — Demo Video Script (≤5:00, YouTube)

**Rules:** max 5 min · **open DIRECTLY with a screen recording** (no title cards, no talking-head intro) · judged on *insight-to-words ratio*. Judges include the ClickHouse founder + ~8 ClickHouse staff and Trigger.dev founders — **show the data layer working**, don't just claim it.

**Setup before recording**
- Browser full-screen at `https://overtaxed-ujwal-s-projects5.vercel.app/app`, **light mode**, DevTools **closed**.
- Second tab: the **Trigger.dev dashboard → Runs (Production)**.
- Third tab: **ClickHouse Cloud SQL console** (optional, for the 1 SQL beat).
- Do one warm-up run first so ClickHouse is hot (no cold-start lag on camera).
- Record at 1080p+. Keep the cursor deliberate. **Total spoken words ≈ 550 max.**

---

## 0:00–0:25 — COLD OPEN (hook + the whole promise in one shot)
**Screen:** Already on `/app`. Immediately type: **`Am I overtaxed at 4317 N Monticello Ave, Chicago?`** → hit send.
**VO:** "One in three US homes is over-assessed for property tax — but almost nobody checks, because the data was never queryable. Watch. I type my address…"
**Screen:** Verdict card streams in: **"You're overpaying ~$3,793/yr."**
**VO:** "…and instead of a paragraph, I get a verdict. I'm overpaying $3,793 a year."

## 0:25–1:00 — THE STREET, PROVEN (ClickHouse speed on screen)
**Screen:** Scroll to the **street map** — subject in green, neighbours red/blue by ratio. **Hover the `⚡ 199 ms · ClickHouse` badge.**
**VO:** "Here's my block. Red homes are assessed above what they actually sold for. This map was computed live — comparable sales by geo-distance across 1.6 million parcels — in **199 milliseconds**, in ClickHouse. That speed badge is on every answer; the claim is shown, not asserted."
**Screen:** Briefly show the comps table (real addresses, sale prices, ratios).

## 1:00–1:40 — SHOULD YOU APPEAL? (Trigger durable sub-task)
**Screen:** Scroll to the **"Two AI advocates debate it"** card — For / Against / **VERDICT: FILE IT**.
**VO:** "Then two Claude advocates argue it out — one for appealing, one playing the assessor's devil's advocate — and return a verdict. That debate runs as a **durable Trigger.dev sub-task**, kicked off by the chat agent." 
**Screen:** Cut to the **Trigger dashboard Runs tab** — point at the `overtaxed` run and the child `appeal-debate` run.
**VO:** "You can see both runs right here in Trigger."

## 1:40–2:10 — FILE IT (real, deployable outcome)
**Screen:** Back on the app → click **"Download filled appeal (PDF)"** → open the PDF.
**VO:** "And it's not a toy. This is a filled Cook County Board of Review appeal — the legal grounds, the proposed value, and the comparable-properties evidence grid — ready to file. Every field is from live records."

## 2:10–2:55 — THE TAX DIVIDE (the innovation / the wow)
**Screen:** Click preset **"The Tax Divide map"** → the heatmap renders → zoom into Chicago, click a red cell's popup.
**VO:** "Now zoom out. This is the Tax Divide — every neighbourhood in Cook County, coloured by over-assessment, aggregated from 1.6 million parcels into 1,800 map cells with a single ClickHouse spatial query. Red areas are where cheaper homes are taxed *above* their value — the regressivity that quietly makes the poor subsidise the rich."

## 2:55–3:30 — IS IT FAIR? (interactive, explorable)
**Screen:** Preset **"Is Cook County fair?"** → scatter + PRD/COD. **Drag the price slider** — watch PRD/COD/impact re-compute.
**VO:** "Ask if the county's fair and you get the IAAO uniformity metrics — PRD and COD — as an interactive chart. Drag the price band and it **re-queries ClickHouse live**. This is the whole point of the theme: the answer is something you explore, not read."

## 3:30–3:55 — DUAL COUNTRY (scope)
**Screen:** Preset **"Check a UK band"** → UK verdict + neighbour bands.
**VO:** "It's not just the US. Give it any UK postcode and it checks your council-tax band live against the VOA, back-casts to the 1991 valuation, and flags if you're in the wrong band — over six million UK sales sit in ClickHouse behind it."

## 3:55–4:35 — UNDER THE HOOD (both tools, load-bearing)
**Screen:** Slowly pan the right-hand **"Under the hood"** sidebar; optionally flash the ClickHouse SQL console running the regressivity query once.
**VO:** "Under the hood, both tools are load-bearing. **ClickHouse is the primary database** — geo-distance comps, PRD/COD, the spatial heatmap, a materialized view for latest sales, `url()` zero-ETL ingestion straight from government CSVs, and — for the OLTP-plus-OLAP bonus — one query that federates our Postgres saved-appeals into the analytics tables via `postgresql()`. **Trigger.dev is the orchestration** — the required `chat.agent()`, durable long-running ingestion, the debate sub-task, and a scheduled task that re-checks saved homes on a cron."

## 4:35–5:00 — IMPACT + CLOSE
**Screen:** The empty-state banner **"~$20B/yr over-shifted onto lower-value US homes"**, then click into **/methodology** and show the "bigger picture" panel (the transparent maths + the QJE citation).
**VO:** "And this isn't a Chicago demo. We *measure* $460 million a year of over-assessment in Cook County — and scaled by owner-occupied homes, consistent with national studies of 118 million homes, that's on the order of **$20 billion a year** shifted onto lower-value homes across the US. The same pipeline already runs a second county and the UK with no code changes. Every one of those homeowners can now check their address, see the proof, and file — in seconds."
**Screen:** End on the live URL + GitHub link (lower-third or final frame).
**VO (last line):** "That's Overtaxed. It's live, it's open source, and it's built entirely on ClickHouse and Trigger.dev."

---

## Tight VO cheat-sheet (if you'd rather freestyle)
- Over-assessed 1 in 3 → **I type an address → $3,793/yr verdict** (no paragraph).
- Street map **199 ms in ClickHouse** (speed shown).
- **Durable Trigger sub-task** debate → FILE IT (show Trigger Runs).
- **Download real appeal PDF** (deployable).
- **Tax Divide heatmap** — 1.6M parcels → 1,800 cells, one spatial query; regressivity = poor subsidise rich.
- **Interactive PRD/COD slider** re-queries live (the theme).
- **UK** postcode via live VOA (dual country, 6M sales).
- Under the hood: **ClickHouse primary** (geoDistance, PRD/COD, MV, url(), postgresql() federation) + **Trigger chat.agent()** (durable ingest, sub-task, cron).
- **$460M/yr impact**, live + open source.

## Do / Don't
- **Do** open on the product mid-action. **Don't** show your face or a logo card first.
- **Do** let visuals breathe — pause on each so judges read them.
- **Do** say a number, then show it on screen at the same moment.
- **Don't** read code line-by-line. Name the ClickHouse/Trigger feature, show it once, move on.
- Keep it **under 5:00**. If tight, trim the UK beat (3:30–3:55) first.
