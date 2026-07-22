# Overtaxed — Recording Playbook (~4:25, follow it click-by-click)

This is a do-this-then-say-this guide. **Screen = what to do.** **Point = where to move the cursor.** **Wait = what must appear before you talk.** **Say = read this out loud.** Times are targets, not handcuffs.

> Golden rules: open mid-action (no landing page, no face). Say a number the instant it's on screen. Let each visual breathe for a beat before you speak. Keep it under 4:40.

---

## PRE-FLIGHT (do this before you hit record)
1. **Warm up every flow once** so ClickHouse is hot and nothing is slow on camera:
   - In `/app`, run each preset once and the address once, then the question `Which Chicago areas overpay the most for homes under $300k?`. Then reload the page so it's clean.
2. **Tabs open, in this order:**
   - Tab 1: `https://overtaxed-ujwal-s-projects5.vercel.app/app` (light mode, DevTools closed, browser full-screen, zoom 100%).
   - Tab 2: `https://overtaxed-ujwal-s-projects5.vercel.app/methodology`
   - Tab 3: `https://overtaxed-ujwal-s-projects5.vercel.app/portfolio`
   - Tab 4: **Trigger.dev → Runs**, environment = **Production**.
3. **Pre-type nothing.** Start on a fresh `/app` with the empty state showing.
4. Record at 1080p+. Move the cursor slowly and deliberately.

---

## LINKS & CLICKS CHEAT SHEET (everything you touch, in order)

**Tabs to open before recording:**
| Tab | URL |
|---|---|
| 1 · App (main) | `https://overtaxed-ujwal-s-projects5.vercel.app/app` |
| 2 · Methodology (impact) | `https://overtaxed-ujwal-s-projects5.vercel.app/methodology` |
| 3 · Portfolio (OLTP+OLAP) | `https://overtaxed-ujwal-s-projects5.vercel.app/portfolio` |
| 4 · Trigger Runs | `https://cloud.trigger.dev/projects/v3/proj_tscqzltxigwvlihuprmk/runs?environment=prod` *(switch env to **Prod** top-left if needed)* |

**End-frame / submission (not clicked mid-demo):**
- Live site: `https://overtaxed-ujwal-s-projects5.vercel.app`
- GitHub: `https://github.com/usv240/overtaxed`

**What you click/type in each beat (in order):**
1. **§1** — type `Am I overtaxed at 4317 N Monticello Ave, Chicago?` → **Send**.
2. **§2** — no clicks; scroll + hover the **`⚡ … ms · ClickHouse`** badge on the map card.
3. **§3** — switch to **Tab 4 (Trigger Runs)**; click into the top **`overtaxed`** run to see the **`appeal-debate`** child.
4. **§4** — Tab 1: type `Yes, prepare my appeal` → **Send** → click **Download filled appeal (PDF)** → then click **Watch this home**.
5. **§5** — type `Which Chicago areas overpay the most for homes under $300k?` → **Send** → click **View the ClickHouse query the agent wrote**.
6. **§6** — click the **The Tax Divide map** preset (bottom bar) → zoom in → click a red cell.
7. **§7** — click the **Is Cook County fair?** preset → drag the **price slider**.
8. **§8** — switch to **Tab 2 (Methodology)** → scroll to the **~$21B/yr** panel.
9. **§9** — switch to **Tab 3 (Portfolio)** → click **View the federated query**.
10. **§10** — Tab 1: click the **Check a UK band** preset (2-sec flash) → scroll up to the verdict card to end.

> The four presets live in the bottom bar of `/app`: **Check a US home · The Tax Divide map · Is Cook County fair? · Check a UK band**. Everything else is a typed prompt or an on-card button.

---

## 1 · HOOK (0:00–0:12)
- **Screen:** Start on the clean `/app` empty state. Click into the address box at the bottom and type: `Am I overtaxed at 4317 N Monticello Ave, Chicago?` (type it as you say the last line, then press **Send**).
- **Say:** "Most homeowners never find out they're overpaying property tax. The proof is public, but it's buried across millions of records nobody could search. So let's check one real Chicago home."
- **Wait:** the assistant's one-line lead-in appears, then cards start streaming.

## 2 · THE VERDICT + PROOF (0:12–0:48)
- **Wait:** the **verdict card** finishes rendering ("You're overpaying ~$3,793/yr", with a red **"strong appeal"** pill top-right and the plain-English paragraph).
- **Point:** at the big headline **"$3,793/yr"**, then at the green **"Reclaim about $3,793/yr by appealing"** strip.
- **Say:** "In one line: this homeowner appears to be paying about $3,800 a year more than the sales evidence supports."
- **Screen:** scroll down slowly to the **"Comparable sales"** table, then to the **street map** ("Your street, by assessment ratio"). The subject home is the **large red dot** in the middle.
- **Point:** hover the **`⚡ … ms · ClickHouse`** badge at the bottom of the map card so the number is visible.
- **Say:** "Red marks homes assessed high relative to nearby sales. That map and those comparables were queried live from ClickHouse, in a few hundred milliseconds."

## 3 · TRIGGER.DEV — THE DURABLE WORKFLOW (0:48–1:22)
- **Wait:** keep scrolling to the **"Should you appeal? Two AI advocates debate it"** card (For appealing / Against / **VERDICT: FILE IT**). If it's still loading, wait for the two columns to fill in.
- **Point:** briefly at the **"For appealing"** box, then the **"Against"** box, then the **"VERDICT: FILE IT"** pill.
- **Say:** "Should they actually appeal? Two AIs argue it out, one for, one honestly against, then give a straight answer."
- **Screen:** switch to **Tab 4 (Trigger Runs)**. **Point** at the parent **`overtaxed`** run, then the child **`appeal-debate`** run nested under it, both green.
- **Do:** **pause and stay silent for ~2 seconds** with the run tree on screen.
- **Say:** "This whole conversation is a Trigger.dev chat-agent run, and it launched that debate as a durable child task. Even if the browser closes, the workflow keeps running, and everything you're seeing here is replayable."

## 4 · TURN IT INTO ACTION — APPEAL + WATCH (1:22–1:52)
- **Screen:** switch back to **Tab 1 (/app)**. In the address box type: `Yes, prepare my appeal` and press **Send**.
- **Wait:** the **"Appeal packet"** card renders, with the buttons **Download filled appeal (PDF)**, **File this appeal**, **Watch this home**.
- **Do:** click **"Download filled appeal (PDF)"** → the PDF opens in a new tab. **Scroll it for ~2 seconds** so the grounds + the comparable-properties evidence grid are visible, then close the tab.
- **Say:** "Then it turns ten seconds of analysis into a pre-filled appeal, the property details, the grounds, and the evidence, ready for review."
- **Screen:** back on `/app`, click **"Watch this home."** It flips to **"Watching — a scheduled Trigger.dev task re-checks it."**
- **Point:** at that new "Watching…" text.
- **Say:** "And one click puts the home on watch: a scheduled Trigger.dev task quietly re-checks it over time. So it's not a one-time lookup, it's a workflow that keeps working."

## 5 · THE CLIMAX — ASK THE DATA ANYTHING (1:52–2:42)
- **Screen:** in the address box type: `Which Chicago areas overpay the most for homes under $300k?` and press **Send**.
- **Wait:** the **"Live from ClickHouse"** card renders with a **bar chart + table**. **Let it sit for ~2 seconds. Do NOT talk yet.**
- **Say:** "But this isn't a fixed dashboard. Ask a brand-new question, and you just get the answer, a chart, ranked worst first."
- **Do:** now click **"View the ClickHouse query the agent wrote"** to expand the SQL. **Point** the cursor slowly at `sale_price < 300000`, then at the `GROUP BY`. Hold it ~3 seconds.
- **Say:** "And here's the part I love: the agent wrote that ClickHouse query itself, safe and read-only. The answer isn't generated first and drawn later, the visualization is the answer. And the exact query and its run time stay on screen, so every answer is auditable."

## 6 · ZOOM OUT — THE TAX DIVIDE (2:42–3:08)
- **Screen:** scroll to the bottom preset bar and click **"The Tax Divide map"** (grid icon). *(Or type "Show me the Tax Divide map for Cook County".)*
- **Wait:** the **heatmap** paints in.
- **Do:** **scroll/zoom into the Chicago core**, then **click one red cell** so its popup appears.
- **Point:** at the legend gradient (top-right of the card: "under … over-assessed").
- **Say:** "Now pull back. One ClickHouse spatial query turns about 1.6 million homes into an explorable map of who's over-taxed. You don't read a report, you see where the burden lands, and click into any pocket of it."

## 7 · PROVE IT'S SYSTEMIC — THE FAIRNESS DIAL (3:08–3:30)
- **Screen:** click the **"Is Cook County fair?"** preset.
- **Wait:** the scatter + the **PRD / COD / REGRESSIVE** line render.
- **Do:** grab the **price slider** ("Explore: only homes priced over $…") and **drag it slowly to the right.** Watch the numbers and the **"live"** label update.
- **Say:** "And it's measurable. Drag this, and the fairness score recomputes live over ClickHouse. The pattern holds: the less a home is worth, the more it's over-taxed. That's the opposite of fair."

## 8 · THE IMPACT (3:30–4:00)
- **Screen:** switch to **Tab 2 (/methodology)** and scroll to the **"~$21B/yr"** panel (the accent box with the transparent maths and the QJE citation underneath).
- **Point:** at the big **"~$21B/yr"** number, then down at the citation line.
- **Say:** "How big is this? In this data we measure about four hundred and sixty million dollars a year of excess assessment in Cook County alone. Using published national research across a hundred and eighteen million homes, we project that to roughly twenty billion a year, shown as a transparent projection, every assumption documented. It's quietly taken from the people who can least afford it."

## 9 · ARCHITECTURE + BONUS, FAST (4:00–4:16)
- **Screen:** switch to **Tab 3 (/portfolio)**. **Point** at the badge **"Postgres (OLTP) joined to ClickHouse (OLAP) · one query · … ms"**, then click **"View the federated query"** to flash the SQL for ~2 seconds.
- **Say:** "Underneath: ClickHouse is the primary database across eight million rows, and Trigger.dev runs the agent, the ingestion, and the scheduled checks. And for the bonus track, your saved appeals stay in Postgres and join the analytics in a single ClickHouse query. One statement, two engines."

## 10 · CLOSE ON THE HOMEOWNER (4:16–4:30)
- **Screen:** switch to **Tab 1 (/app)**, click **"Check a UK band"** for a **2-second flash** of the UK verdict, then scroll back up to land on the clean **verdict card** (your best-looking screen). Make sure the URL bar is visible.
- **Say:** "The same pipeline already covers a second US county and live UK council-tax checks. The data was always public, the missing piece was making it understandable. Overtaxed turns public records into evidence people can actually act on. That's Overtaxed."
- **End frame:** hold on that clean screen for 1–2 seconds, then stop recording.

---

## IF SOMETHING GOES WRONG (record fixes)
- **A card is slow / spinner hangs:** you didn't warm up that flow. Stop, run it once off-camera, then re-record the beat.
- **findProperty asks you to pick a candidate:** just click the Monticello one and continue; or re-type the full address.
- **The debate is still loading when you reach §3:** wait for it. The "durable sub-task" point is stronger *with* the loader, so you can even say "it's running in the background right now" over the loader.
- **"Ask the data anything" returns nothing / an error:** confirm the last Trigger deploy included it (`npx trigger.dev@latest deploy`), then retry the question.
- **You ran long:** cut the fairness beat (§7) first, then trim the impact VO (§8). **Never cut** the verdict (§2), the Trigger workflow (§3), or the ask-anything climax (§5).

## CREDIBILITY GUARDRAILS (never deviate)
- Never say "my home," "we won," "money back," or "ready to file/send." Say **"a real home," "ready to review," "evidence to challenge it."**
- The $21B figure is always **"a projection."** Never a promise.
- The map shows **assessed value vs nearby sales evidence** — don't claim more.

## THE THREE THINGS A JUDGE MUST REMEMBER
1. One homeowner gets an understandable, evidence-backed answer in seconds.
2. ClickHouse lets the agent explore millions of records live and visually (it writes its own SQL).
3. Trigger.dev makes it a durable, production-style workflow (the debate sub-task + the watch task).
