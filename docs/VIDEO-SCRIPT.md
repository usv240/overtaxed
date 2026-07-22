# Overtaxed — Demo Video Script (storytelling, ≤5:00)

**The rules:** max 5 minutes, on YouTube, **open straight on a screen recording** (no title card, no talking-head intro), judged on *insight-to-words ratio*. Judges include the ClickHouse founder + ~8 ClickHouse staff and the Trigger.dev founders, so **let them SEE the data working**.

**The story in one line:** one person quietly overpays → we prove it, help them fight it → then we pull back and show it's a **$20-billion-a-year** national injustice, and this one tool answers it for anyone, on live data.

**Setup before you record**
- Full-screen browser on `https://overtaxed-ujwal-s-projects5.vercel.app`, **light mode**, DevTools closed.
- Second tab: **Trigger.dev dashboard → Runs (Production)**.
- Do **one warm-up run of each flow first** so ClickHouse is hot (no cold-start lag on camera).
- Speak slowly and plainly. Let each visual sit for a beat. **~600 words of narration, max.**

---

## 1 · The hook — a quiet, everyday injustice (0:00–0:20)
**Screen:** Start on the app's home screen (`/app`), clean and still.
**VO:** "Right now, one in three American homes is being taxed as if it's worth more than it really is. Almost nobody checks, because the proof was buried in millions of public records nobody could search. So let's search it. This is my home address."
**Screen:** Type **`Am I overtaxed at 4317 N Monticello Ave, Chicago?`** and hit send.

## 2 · The verdict — real money, in one line (0:20–0:50)
**Screen:** The verdict card streams in: **"You're overpaying ~$3,793/yr,"** with the plain-English explanation.
**VO:** "No paragraph, no jargon. Just the answer: this home is overpaying about $3,800 a year. And here's the proof."
**Screen:** Scroll to the **street map** (subject glowing red among neighbours) and the **comparable sales** table. **Hover the `⚡ ClickHouse` latency badge.**
**VO:** "Every red home is taxed above what it actually sold for. This map was built live, from real sales next door, in a couple hundred milliseconds, in ClickHouse."

## 3 · Should I fight it? — two AIs debate it (0:50–1:20)
**Screen:** Scroll to the **"Two AI advocates debate it"** card: For / Against / **VERDICT: FILE IT**.
**VO:** "Not sure if it's worth appealing? Two AIs argue it out for you, one for, one honest about the risks, and give you a straight answer. That debate runs as a durable background job on Trigger.dev."
**Screen:** Quick cut to the **Trigger dashboard Runs tab** showing the `overtaxed` run and the `appeal-debate` child run, then back.

## 4 · Fight it — a real, ready-to-file appeal (1:20–1:45)
**Screen:** Click **"Download filled appeal (PDF)"**, open the PDF.
**VO:** "And it's not a toy. That's a complete, filled-in Cook County appeal, the legal grounds and the evidence, ready to send. We just handed a stranger their money back."

## 5 · The turn — "but you can ask it anything" (1:45–2:30)
**Screen:** Back on the app. In the box, type a fresh question: **`Which Chicago areas overpay the most for homes under $300k?`**
**VO:** "But this isn't just four buttons. You can ask it *anything*. Watch."
**Screen:** The **dataResult** card appears: a chart + table. **Open the "View the ClickHouse query" panel** to reveal the SQL.
**VO:** "It wrote that ClickHouse query itself, safely, ran it over millions of rows, and drew the answer, live. This is 'ask your data anything,' pointed at every home in the county."

## 6 · Zoom out — The Tax Divide (2:30–3:00)
**Screen:** Click the **"The Tax Divide map"** preset. The heatmap paints in; zoom into Chicago, click a red area.
**VO:** "Now pull back. This is the whole county at once, a million and a half homes, coloured by how unfairly they're taxed. The red areas are where cheaper homes are overvalued the most. It's the same quiet bias, everywhere."

## 7 · Prove it's systemic — the fairness dial (3:00–3:25)
**Screen:** Click **"Is Cook County fair?"**. Scatter + PRD/COD appear. **Drag the price slider.**
**VO:** "And you can measure it. Drag this, and the fairness score recomputes live over ClickHouse. The pattern is clear: the less a home is worth, the more it's over-taxed. That's the opposite of fair."

## 8 · It's not just America (3:25–3:45)
**Screen:** Click **"Check a UK band"**. The UK verdict appears.
**VO:** "And it's not just the US. Any UK postcode gets checked, live, against the official valuation office, going all the way back to a rushed 1991 estimate. Same idea, same injustice, different country."

## 9 · The impact — why this matters (3:45–4:25)
**Screen:** Open **/methodology**, scroll to the **"~$21B/yr"** panel with the transparent maths + the QJE citation.
**VO:** "So how big is this really? We *measure* about $460 million a year of unfair over-assessment in Cook County alone. Scaled across the country, and backed by national research covering a hundred and eighteen million homes, that's on the order of **twenty billion dollars a year**, quietly taken from the people who can least afford it. Every one of them can now check their address, see the proof, and fight back, in about ten seconds."

## 10 · Under the hood + close (4:25–4:55)
**Screen:** Briefly pan the "Under the hood" sidebar / the methodology SQL blocks.
**VO:** "Underneath, it's two tools doing real work: ClickHouse as the primary database, doing all of this live over eight million rows, and Trigger.dev running the agent, the background jobs, and even a query that joins our Postgres data straight into ClickHouse in one statement."
**Screen:** End on the live URL + the GitHub link.
**VO (last line):** "That's Overtaxed. It's live, it's open source, and it turns a wall of buried public records into an answer anyone can see. Thanks for watching."

---

## The whole story in 8 beats (if you'd rather freestyle)
1. 1 in 3 homes overpay, nobody checks → **type my address**.
2. **$3,793/yr verdict** + the **street map** (⚡ ClickHouse speed).
3. **Two AIs debate** → FILE IT (durable Trigger sub-task).
4. **Download the real appeal PDF** (money back).
5. **"Ask it anything"** → it writes **live ClickHouse SQL** → chart (the wow).
6. **The Tax Divide heatmap** → the bias, everywhere.
7. **Fairness slider** (recomputes live) + **UK band check** (dual country).
8. **$460M measured → ~$20B national** → close: live, open source, ClickHouse + Trigger.

## Do / Don't
- **Do** open mid-action on the product. **Don't** show your face or a logo first.
- **Do** say a number the moment it's on screen. **Do** let each visual breathe.
- **Do** linger on the **live SQL** and the **latency badge** — that's catnip for the ClickHouse judges.
- **Don't** read code or explain architecture for more than ~20 seconds.
- Keep it **under 5:00**. If tight, trim the UK beat (3:25–3:45) first, then shorten the impact VO.
