# Overtaxed

**Type your home address. Instead of a paragraph, see a map of your street proving you're taxed too high, a one-line "you're overpaying $X/yr" verdict, and a pre-filled appeal — plus the map showing the poor are overtaxed to subsidise the rich.**

Built for the **ClickHouse × Trigger.dev Virtual Summer Hackathon 2026** — theme *"Beyond the Wall of Text."*

> ⚠️ Estimates from public records. Not tax or legal advice.

---

## Why it exists

30–60% of US homes are over-assessed and 400,000+ UK homes sit in the wrong council-tax band (still on 1991 "drive-by" valuations) — yet **fewer than 1 in 20 people ever challenge it**, and successful appeals save **$1,000–3,000 / £thousands a year**. The prices are public; nobody could *query* them. Overtaxed makes your street answerable in milliseconds.

## The stack (both tools are load-bearing)

| Layer | Tech | Role |
|---|---|---|
| Primary database | **ClickHouse Cloud** | 24M+ UK sales + millions of US parcels; live `geoDistance` comps, IAAO sales-ratio science (PRD/COD), sub-second regressivity aggregation |
| Orchestration | **Trigger.dev `chat.agent()`** | the agent loop + long-running ingestion + live UK band lookup + appeal generation + human-in-the-loop |
| OLTP (bonus) | **Postgres → ClickPipes** | saved properties & appeals → CDC into ClickHouse (OLTP+OLAP) |
| Frontend | **Next.js · MapLibre GL · Recharts · shadcn/ui · json-render** | the response *is* a map / chart / interactive component |
| Agent brain | **Claude (Anthropic)** via AI SDK | tool routing + narration |

## Architecture

_(diagram — see [docs/PLAN.md](docs/PLAN.md) §2)_

## Data sources

- **US:** Cook County Assessor — Assessed Values + Parcel Sales (open data).
- **UK:** HM Land Registry Price Paid Data (24M+ sales, Open Government Licence); ONS postcode centroids; VOA band via live lookup.

## Local development

```bash
cp .env.example .env   # then fill in real values
npm install
npx trigger.dev@latest dev   # orchestration
npm run dev                  # web app → http://localhost:3000
```

## How ClickHouse & Trigger.dev are used

_(filled in as we build — this section is graded, 25% of score)_

## License

[MIT](LICENSE).
