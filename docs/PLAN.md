# Overtaxed — Winning Plan
### ClickHouse × Trigger.dev Virtual Summer Hackathon 2026

> **One sentence:** Type your home address, and instead of a paragraph you get a map of your street proving you're taxed too high, a one-line "you're overpaying $X/yr" verdict, and a pre-filled appeal — plus the scandal map showing the poor are overtaxed to subsidise the rich.

- **Builder:** solo. **Build window:** 17 Jul (open) → **23 Jul midnight AoE** (submit by end of 22 Jul; 23rd = pure buffer).
- **North Star metric of the demo:** *insight-to-words ratio.* The response is a visual. Text is the garnish.

---

## 1. Why this wins (evidence, not vibes)

### 1a. What the rules reward (from Rules.md)
| Criterion | Weight | Our answer |
|---|---|---|
| Use of ClickHouse & Trigger.dev | **25%** | Both load-bearing. ClickHouse = primary DB doing live million-row regressivity/comps analytics. Trigger.dev = `chat.agent()` (required) + ingestion + live band lookup + appeal generation + human-in-the-loop. |
| Problem fit | 20% | "Am I being overtaxed on my home?" — 85M US homeowners + every UK household. A *diff-map* cannot be a paragraph → perfect theme fit. |
| Technical implementation | 20% | 24M+ UK sales + millions of US parcels; `geoDistance` comps, IAAO sales-ratio science (PRD/COD), `quantileTDigest`, live sub-second aggregation. |
| Innovation | 20% | The **regressivity exposé map** — no consumer product does this. |
| Scalability & impact | 10% | Direct money in a pocket, this year, in two countries. |
| Presentation | 5% | The demo *is* someone saving money in 40 seconds + the scandal reveal. |

**Hard requirements (non-negotiable, from Rules.md & FAQ):**
- ✅ Must use **Trigger.dev `chat.agent()`** as the orchestration layer (not a generic agent).
- ✅ **ClickHouse must be the primary database.**
- ✅ Public GitHub repo, **MIT or Apache-2.0**.
- ✅ YouTube demo, **max 5 min, open directly with screen recording** (no intro).
- ✅ All code written in the build window.

### 1b. What past ClickHouse winners did (NYC AI Agents Hackathon)
- **🥇 VitalSignal** (outbreak alerts) & **🥈 RedBot** (chatbot pentest) — *both already exist as commercial products.* Judges **did not penalise novelty**. They rewarded:
  1. **Agent + real-time data LOOP**: `ingest → ClickHouse → compute features → agent acts`. Not "chat→SQL→chart."
  2. **Ruthless narrow scope, maximum polish** — one complete end-to-end flow.
  3. **ClickHouse committed early & central.**
  4. **Real, personal problem in one sentence.**
  5. **A working end-to-end demo**, not a mockup.

> **The load-bearing insight:** "A startup already does this" is NOT disqualifying (Ownwell exists; VitalSignal won anyway). We win on *execution of the agent-over-fresh-data loop + a jaw-dropping visual + polish*, exactly what this theme demands.

### 1c. The 3 non-negotiables that turn "good" into "winner"
1. **It's an agentic LOOP, visibly.** The agent autonomously: finds the property → runs comps → computes sales-ratio → detects regressivity → scores appeal strength → generates the packet. The judge *feels* the agent working.
2. **Lead with the regressivity map** (innovation + ClickHouse-as-star), *then* land the personal payoff (money + appeal). Innovation and impact in one arc.
3. **Solo discipline:** build the engine once; the demo surfaces both US + UK; polish ONE hero flow to perfection.

---

## 2. Architecture

```
┌────────────────────────── Frontend (Next.js, Vercel) ───────────────────────────┐
│  useChat + useTriggerChatTransport → renders json-render specs                    │
│  Components: VerdictCard · StreetMap(MapLibre) · RegressivityScatter(Recharts)     │
│              DistributionStrip · CompsTable · AppealPacket                         │
└───────────────▲───────────────────────────────────────────────┬──────────────────┘
                │ realtime stream (Trigger.dev)                   │ trigger
                │                                                 ▼
┌───────────────┴──────────────── Trigger.dev (orchestration) ──────────────────────┐
│  chat.agent("overtaxed")  ── tools ──►                                             │
│    findProperty · analyzeProperty · regressivity · lookupUkBand ·                  │
│    renderVisualization · generateAppealPacket   (+ wait-for-token HITL)            │
│  Background tasks: ingest.usSales · ingest.usAssessments · ingest.ukSales          │
│                    enrich.geo · lookupUkBand (retryable scrape)                    │
└───────────────▲───────────────────────────────────────────────┬──────────────────┘
                │ read-only SQL (analytics)                       │ CDC (ClickPipes)
                ▼                                                 │
┌────────────── ClickHouse Cloud (PRIMARY DB / OLAP) ──┐   ┌──────┴──────────────────┐
│  sales · assessments · uk_bands · band_thresholds     │   │  Postgres (OLTP, bonus) │
│  MV: parcel_ratios · area_stats (PRD/COD)             │◄──┤  users · saved_props ·  │
│  Fns: geoDistance comps, quantileTDigest, corr        │   │  appeals(status)        │
└───────────────────────────────────────────────────────┘   └─────────────────────────┘
```

**Stack** (mirrors the official [ClickHouse Chat Agent example](https://trigger.dev/docs/guides/example-projects/clickhouse-chat-agent.md) — the sanctioned path, which itself helps the 25%):
- Next.js + TypeScript, shadcn/ui, **Recharts** (charts), **MapLibre GL** (maps), **json-render** (the `renderVisualization` contract).
- Trigger.dev **`chat.agent()`**, AI SDK + **Anthropic Claude** (`claude-opus-4-8` for the agent; cheaper model for tool-routing if needed).
- ClickHouse Cloud via `@clickhouse/client`, **read-only** enforced on the agent's query path.
- Postgres (Supabase) → **ClickPipes** CDC → ClickHouse for the **OLTP+OLAP bonus (€1k + Lego)**.

---

## 3. Data sources (all verified open + feasible)

| Country | Table | Source | Notes |
|---|---|---|---|
| US | assessments | Cook County Assessor — Assessed Values (Socrata/CSV) | Assessed + market value per PIN, has geo. |
| US | sales | Cook County Assessor — Parcel Sales | Sale price + date per PIN. |
| US | (opt) | LA County parcels (2.4M) | Stretch, only if time. |
| UK | sales | HM Land Registry **Price Paid Data** (24M+ rows since 1995, OGL, bulk CSV) | Postcode-level; commercial use OK. |
| UK | geo | ONS Postcode Directory (open) | Postcode → lat/lng centroid for the map. |
| UK | bands | VOA — **live per-address lookup** (Trigger.dev retryable task) + `band_thresholds` (1991 £ ranges A–H) | Per-property band is not bulk → live lookup = a *great* Trigger.dev story. |

**Feasibility guardrail:** iterate on a *slice* first (one Cook County township + one UK postcode district), then scale ingestion. Never block on full national data.

---

## 4. ClickHouse — schema & the "wow" queries

**Unified `sales`** (both countries): `country, region, postcode, address, pin, sale_date, sale_price, lat, lng, prop_type, beds/size`.
**`assessments`** (US): `pin, tax_year, assessed_value, market_value, lat, lng, class`.
**`uk_bands`**: `postcode, address, band, looked_up_at`; **`band_thresholds`**: band → 1991 £ range.

**Materialised views (precomputed for speed):**
- `parcel_ratios`: per parcel `ratio = assessed_value / most_recent_sale_price`.
- `area_stats`: per region the **IAAO uniformity metrics** — this is the credibility move:
  - **COD** (Coefficient of Dispersion) — assessment uniformity.
  - **PRD** (Price-Related Differential) = `mean(ratio) / weightedMean(ratio, price)`. **PRD > 1.03 ⇒ regressive** (poor overtaxed). Using the real assessment-science metric = instant credibility with Alexey & the engineers.

**The three hero queries:**
1. **Comps / fair value** — nearest N sales by `geoDistance(lat,lng, ...)`, same `prop_type`, last 18 months → estimate fair market value → fair assessment → overpayment $. 
2. **Where do you rank** — `quantileTDigest` of neighbourhood ratios; the subject's percentile → the DistributionStrip.
3. **Regressivity (the innovation)** — over an entire county, `corr(sale_price, ratio)` + PRD/COD, and per-parcel ratios for the choropleth. **Runs live over millions of rows in ~40ms** — the ClickHouse flex, with a slider that re-aggregates on drag.

---

## 5. Trigger.dev — the agentic loop (the winning pattern)

**`chat.agent("overtaxed")`** with tools (each returns data the model turns into a `renderVisualization` call):
- `findProperty(address)` → geocode + resolve PIN/postcode.
- `analyzeProperty(id)` → **the loop**: comps → fair value → over-assessment → appeal-strength score.
- `lookupUkBand(address)` → live VOA lookup (retryable background task) + neighbour bands.
- `regressivity(region)` → PRD/COD + per-parcel ratios for the map.
- `renderVisualization(spec)` → emits a json-render spec (validated against a shared catalog so prompt & renderer can't drift).
- `generateAppealPacket(id)` → filled evidence packet + form (PDF via a task).

**Background / scheduled tasks** (the "long-running, no-timeout, retried" justification):
- `ingest.usSales`, `ingest.usAssessments`, `ingest.ukSales` — stream CSV → ClickHouse batches.
- `enrich.geo` — postcode → lat/lng.

**Trigger.dev feature flexes** (cheap points, big signal):
- **`wait-for-token` (human-in-the-loop):** "Confirm your property details before we file" pauses the run, resumes on user confirm.
- **Realtime streaming:** the map/verdict stream in as the agent computes.

---

## 6. Beyond the Wall of Text — the visual catalog

| Component | Lib | The insight it delivers |
|---|---|---|
| **VerdictCard** | shadcn | "You're overpaying ~$1,400/yr · owed $Y back · appeal strength: Strong". |
| **StreetMap** | MapLibre | Your neighbours coloured by sales-ratio; *your* home glows red. |
| **RegressivityScatter/Choropleth** | Recharts/MapLibre | sale_price ↔ ratio trend proving the poor overpay; PRD/COD annotated. |
| **DistributionStrip** | Recharts | Where your ratio sits vs the neighbourhood — one glance = "robbed." |
| **CompsTable** | shadcn | The comparable sales the agent used (transparency = credibility). |
| **AppealPacket** | — | Downloadable, pre-filled, with the evidence. |

Rule: **if the best answer is a paragraph, it's a bug.** Every agent turn resolves to one of these.

---

## 7. The 5-minute demo script (opens on screen recording, per rules)

| Time | Beat | Judging criteria hit |
|---|---|---|
| 0:00–0:30 | **UK address** → "Band E; homes like yours are D; overpaying £X/yr, owed £Y back." Street map. | Problem fit + wins the **UK founder-judges** personally. |
| 0:30–1:30 | **Cook County address** → VerdictCard + StreetMap + CompsTable. Real money. | Impact + transparency. |
| 1:30–3:00 | **"But this isn't just you."** → Regressivity map of the whole county. PRD/COD. "Poorest homes overtaxed 20%, richest undertaxed 10% — live over 2M parcels in 40ms." Drag the slider → re-aggregates. **THE WOW.** | **Innovation + ClickHouse (the 25%)** + theme. |
| 3:00–4:00 | Click **"file appeal"** → human-in-the-loop confirm → pre-filled packet generates. | **Trigger.dev (the 25%)** + agentic loop. |
| 4:00–5:00 | Architecture: ingest (Trigger.dev, 24M+ rows) → ClickHouse (primary, the speed) → `chat.agent()` loop → visual response. OLTP+OLAP: Postgres→ClickPipes→ClickHouse. Close on impact. | Tech impl + scalability + bonus category. |

**The line to say out loud:** *"The government made these prices comparable and never gave anyone a way to check. We made your street answerable in 200 milliseconds."*

---

## 8. Six-day schedule (solo) — with P0/P1/P2

**Day 1 (Thu 17) — Foundation.** Claim credits. Spin up ClickHouse Cloud + Trigger.dev project. Clone/adapt the official ClickHouse Chat Agent example; get it running end-to-end on a trivial dataset. Define schema. Ingest a *slice* (one township + one postcode district) to iterate fast. **Exit:** an address returns *something* through `chat.agent()` + ClickHouse.

**Day 2 (Fri 18) — Data & the math.** Trigger.dev ingestion tasks: full Cook County assessments+sales; UK Land Registry (a few regions); ONS geo enrichment. Write & sanity-check the 3 hero queries (comps, ratio percentile, PRD/COD). **Exit:** correct overpayment numbers for real addresses in a SQL console.

**Day 3 (Sat 19) — The loop.** Wire the agent tools: `findProperty`, `analyzeProperty`, `renderVisualization`. `lookupUkBand` task. **Exit:** real address → VerdictCard + CompsTable, fully through the agent.

**Day 4 (Sun 20) — The visuals (invest here).** StreetMap coloured by ratio; RegressivityScatter + PRD/COD; DistributionStrip. Make `renderVisualization` emit them. **Exit:** the "beyond wall of text" payoff is real and beautiful.

**Day 5 (Mon 21) — The wow + bonus + polish.** Full-county regressivity map + live slider. `generateAppealPacket`. Human-in-the-loop confirm. **OLTP+OLAP:** Postgres + ClickPipes for saved properties/appeals. UI polish. **Exit:** feature-complete.

**Day 6 (Tue 22) — Ship.** Record the 5-min video (script above). README (setup + architecture + data credits + license). Deploy (Vercel + deployed Trigger.dev). **Submit early.** 23rd = buffer only.

---

## 9. Scope control (solo survival) — the cut-list

- **P0 (must ship, or we have nothing):** Cook County full flow — address → VerdictCard + StreetMap + CompsTable + **regressivity map**; `chat.agent()` + ClickHouse + ≥1 Trigger.dev ingestion task; working recorded demo.
- **P1 (strongly want):** UK demo segment (band lookup + neighbour comparison for showcased postcodes — need *not* be full-national); appeal packet; PRD/COD.
- **P2 (bonus points):** live slider; human-in-the-loop; **OLTP+OLAP ClickPipes bonus**; LA County.
- **If time collapses:** US-only — but **the regressivity map MUST survive.** It's the innovation; without it we're an Ownwell clone.

**Cook County is the P0 hero on purpose:** cleanest open data (both tables) *and* it's literally the [ProPublica "Tax Divide"](https://features.propublica.org/the-tax-divide/cook-county-commercial-and-industrial-property-tax-assessments/) scandal county — the regressivity story is pre-validated and dramatic.

---

## 10. Rubric self-scorecard (honest target)

| Criterion | Weight | Target | Why |
|---|---|---:|---|
| CH + Trigger use | 25% | 9/10 | Both structurally necessary; multiple real Trigger features; ClickHouse is the star. |
| Problem fit | 20% | 9/10 | Universal, money, and un-expressible as text. |
| Technical impl | 20% | 8/10 | Real geo + IAAO stats at million-row scale, sub-second. |
| Innovation | 20% | 8/10 | Regressivity exposé is genuinely fresh even though appeals aren't. |
| Scalability & impact | 10% | 8/10 | Two countries, direct savings. |
| Presentation | 5% | 9/10 | The demo is the money shot + the scandal reveal. |

---

## 11. Submission checklist (from Rules.md)
- [ ] Public GitHub repo, **MIT or Apache-2.0** license file.
- [ ] YouTube video **≤ 5:00**, opens on screen recording (no talking-head intro).
- [ ] `chat.agent()` used as orchestration (show it in README + code).
- [ ] ClickHouse is the **primary** DB (show schema + queries in README).
- [ ] README: problem, architecture diagram, data sources + credits, setup steps, "how both tools are used", honest disclaimer ("estimates from public data, not tax advice").
- [ ] Deployed/reproducible (cloud env or clear run instructions).
- [ ] Submitted via official portal by **captain** (that's us) **before 23 Jul midnight AoE** — target 22 Jul.

## 12. Credibility guardrails (don't overclaim — Alexey will check)
- Show **comps and confidence** — never a magic number. Low-data areas say "low confidence."
- Label everything **"estimate from public records, not tax/legal advice."**
- Use **PRD/COD** (the real IAAO metrics) so the fairness claim is defensible, not editorial.

---

## 13. The "Beyond" layer — how we exceed AND *show it*

**Principle:** exceeding ≠ more features (that kills a solo build — the winners won on discipline). Exceeding = a few **disproportionate showstoppers**, each **visible in the video or README**, each aimed at a **specific judge/criterion**. A brilliant thing you don't show scores 0.

**Leverage fact:** 4 of ~21 judges *built Trigger.dev*; several ClickHouse judges live in the query engine. Point every flex at a face.

### Tier A — cheap to build, massive signal (do all; mostly "show it")
| # | Move | Shown where | Wins / judge |
|---|---|---|---|
| A1 | **Live latency badge**: every viz shows "⚡ 42 ms over 2.1M rows". | On-screen on each answer + the slider. | ClickHouse 25% + tech 20% · **Alexey** |
| A2 | **Trigger.dev dashboard on camera** — real runs, retries, a durable long-running ingest, the `wait-for-token` pause, sub-agent streaming. | ~30 s cut in the video. | Trigger 25% · **Eric/Matt/Dan/James (4 votes)** |
| A3 | **Methodology & trust page** — PRD/COD, data vintage, confidence bands, "estimate, not tax advice." | In-app link + README. | Credibility; defends vs "overclaim" · technical judges |
| A4 | **Shareable verdict card** — "I'm owed $1,400 — check yours." | End of demo, one frame. | Presentation 5% + impact 10% |

### Tier B — substantive, folded into existing days (do all if P0 holds)
| # | Move | Shown where | Wins / judge |
|---|---|---|---|
| B1 | **Deliberately capture the OLTP+OLAP bonus (€1k + Lego):** Postgres write (save home / file appeal) → **ClickPipes** CDC → ClickHouse analytics, as ONE live moment ("I save my home → it appears in my portfolio analytics instantly"). | The bonus beat in the video. | **Bonus category outright** |
| B2 | **`s3()` zero-ETL ingestion** — ClickHouse reads the raw gov CSVs straight off object storage, no separate loader. | README architecture + one demo line. | ClickHouse 25% · **Alexey** (and genuinely simpler) |
| B3 | **One truly *explorable* response** — click a neighbour on the map → drills in; drag the slider → live re-aggregate. The soul of "beyond the wall of text." | The wow beat. | Innovation 20% + theme + presentation |
| B4 | **An actually-fileable appeal packet** — real Cook County appeal fields + real UK VOA challenge route, not a toy PDF. | The file-appeal beat. | Impact 10% + credibility |

### Tier C — ONE moonshot, gated (only if P0+P1 done by end of Day 4)
- **C1 · Regressivity Leaderboard** — rank Cook County townships (stretch: US counties) most→least regressive on one screen. Systemic scandal at national scale = the innovation ceiling raised again, and pure ClickHouse-scale theatre. **Guardrail: build only if ahead of schedule; never at the expense of the P0 hero flow.**

**Discipline guardrail:** Tier A is mostly *presentation* — schedule it into Day 6 and it can't threaten the build. Tier B slots into Days 4–5. Tier C is forbidden until P0+P1 are locked. **If forced to choose, a flawless P0 + Tier A beats a shaky P0 + Tier C.** Polish is the multiplier; features are not.

> **Elevation:** the OLTP+OLAP bonus (was P2) is now a **deliberate target (B1)** — it's a whole prize category (€1k + Lego) for ~a half-day of work, and it's exactly the "OLTP + OLAP" the rules name.
