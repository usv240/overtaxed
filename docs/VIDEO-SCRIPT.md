# Overtaxed — Demo Video Script (director's cut, ~4:20)

**Rules:** max 5 min, YouTube, **open straight on a screen recording** (no title card, no face). Judged on *insight-to-words ratio*. Judges include the ClickHouse founder + ~8 ClickHouse staff and the Trigger.dev founders, so **let them SEE the data working** — and give **both** tools their moment.

**Target 4:15–4:35.** Do not fill the full 5:00; leave headroom for pauses. **~560 words of narration, max.**

**The three things a judge must remember afterwards:**
1. One homeowner gets an understandable, evidence-backed answer in seconds.
2. ClickHouse lets the agent explore millions of records live and visually (it even writes its own SQL).
3. Trigger.dev turns that into a durable, production-style workflow.

**Setup:** full-screen, light mode, DevTools closed. Second tab on **Trigger.dev → Runs (Production)**. **Warm up every flow once** so ClickHouse is hot. Speak slowly and plainly. Say a number the moment it's on screen.

---

## 1 · Hook (0:00–0:12)
**Screen:** Address already typed in the box: `Am I overtaxed at 4317 N Monticello Ave, Chicago?` — press Enter around second 8.
**VO:** "Millions of homeowners may be paying tax on a value higher than their home is really worth. The proof is public, but buried across millions of records nobody could search. So let's check a real Chicago home."

## 2 · The verdict + visual proof (0:12–0:48)
**Screen:** Verdict card streams in: **"You're overpaying ~$3,793/yr,"** plain-English explanation → scroll to the **street map** (subject red) and **comparable sales**. **Hover the `⚡ ClickHouse` latency badge.**
**VO:** "In one line: this assessment looks about $3,800 a year too high. Red marks homes assessed high relative to the sales evidence around them. That map and those comparables were computed live in ClickHouse, in a few hundred milliseconds."

## 3 · Trigger.dev: the durable workflow (0:48–1:20)
**Screen:** Scroll to the **debate** card (For / Against / **FILE IT**). Then cut to the **Trigger dashboard Runs tab** — point at the parent `overtaxed` run **and** the child `appeal-debate` run, both green. Hold it **~7 seconds.**
**VO:** "Should they actually appeal? The whole conversation is a Trigger.dev `chat.agent` run, and it launches this two-sided analysis as a durable child task — one side argues for, one against. Because it's durable, the long-running work and retries don't vanish when a browser request ends."

## 4 · Turn analysis into action (1:20–1:38)
**Screen:** Click **"Download filled appeal (PDF)"**, open it briefly.
**VO:** "Then it turns ten seconds of analysis into a pre-filled appeal — the property details, the grounds, and the comparable-sale evidence, organised and ready for the homeowner to review."

## 5 · CLIMAX — ask the data anything (1:38–2:30)
**Screen:** Back on the app. Type: `Which Chicago areas overpay the most for homes under $300k?` → the **chart + table** appear → **open "View the ClickHouse query"** and **let the SQL sit on screen ~3 seconds.** Point the cursor at `sale_price < 300000` and the `GROUP BY`.
**VO:** "But this isn't a fixed dashboard. Ask a brand-new question, and the agent writes its own ClickHouse query — safe and read-only — runs it across the live data, and picks a visual answer. You can see it here: it filtered homes under three hundred thousand, grouped by area, and ranked the worst. The exact SQL and the run time stay visible, so every answer is auditable."

## 6 · Zoom out — The Tax Divide (2:30–2:58)
**Screen:** Click **"The Tax Divide map"** preset → heatmap paints in → zoom into Chicago, click a red area.
**VO:** "Now pull back. One ClickHouse spatial query turns about 1.6 million homes into an explorable map of who's over-taxed. You don't read a report — you see where the burden lands, and click into any pocket of it."

## 7 · Prove it's systemic — the fairness dial (2:58–3:20)
**Screen:** Click **"Is Cook County fair?"** → scatter + score → **drag the price slider.**
**VO:** "And it's measurable. Drag this, and the fairness score recomputes live over ClickHouse. The pattern holds: the less a home is worth, the more it's over-taxed. That's the opposite of fair."

## 8 · The impact (3:20–3:52)
**Screen:** Open **/methodology**, scroll to the **"~$21B/yr"** panel (transparent maths + the QJE citation).
**VO:** "How big is this? Within this data we measure about four hundred and sixty million dollars a year of excess assessment in Cook County alone. Scaled nationally — and consistent with published research across a hundred and eighteen million homes — it points to roughly twenty billion dollars a year, and we show that as a transparent projection, not a promise. It's quietly taken from the people who can least afford it."

## 9 · The architecture + bonus, fast (3:52–4:08)
**Screen:** Flash the "Under the hood" sidebar; then the **/portfolio** page showing the **"Postgres (OLTP) joined to ClickHouse (OLAP) · one query"** badge.
**VO:** "Underneath: ClickHouse is the primary database across eight million rows; Trigger.dev runs the agent, the ingestion, and scheduled checks. And for the bonus track, saved appeals stay in Postgres and join the analytics in a single federated ClickHouse query — one statement, two engines."

## 10 · Close on the homeowner (4:08–4:25)
**Screen:** A quick 2-second flash of the **UK band** result, then land on the clean verdict card (best product screen), URL + GitHub visible.
**VO:** "The same pipeline already covers a second US county and live UK council-tax checks. The data was always public — the missing piece was making it understandable. Overtaxed turns millions of buried records into an answer any homeowner can actually use. That's Overtaxed."

---

## Credibility guardrails (do NOT deviate)
- Never say "my home address," "we won," "money back," or "ready to file/send." Say **"a real home," "ready to review," "evidence to challenge it."**
- The national figure is a **projection**, always labelled as such. Never state it as guaranteed.
- The map shows **assessed value vs nearby sales evidence** — don't claim more than that.

## Do / Don't
- **Do** open mid-action; **don't** show a landing page, a face, or a logo card first.
- **Do** give Trigger its full ~7s dashboard beat — both tools must feel load-bearing.
- **Do** hold the generated SQL and the latency badge — that's the ClickHouse-judge payoff.
- **Don't** exceed ~20s on architecture. **Don't** run past ~4:35.
- If long, trim the fairness beat (§7) before anything else; never cut the Ask-anything climax.
