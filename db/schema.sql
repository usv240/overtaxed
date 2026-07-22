-- Overtaxed — ClickHouse schema (PRIMARY DATABASE)
-- Apply with: npm run db:schema   (see scripts/apply-sql.mjs)

-- ─────────────────────────────────────────────────────────────────────────────
-- sales — unified property transactions, US (Cook County) + UK (Land Registry)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS overtaxed.sales
(
    country     LowCardinality(String),          -- 'US' | 'UK'
    region      LowCardinality(String),          -- 'Cook County' | 'Greater London' | postcode area
    txn_id      String,                          -- source transaction/deed id
    pin         String,                          -- parcel id (US); '' for UK
    address     String,
    postcode    String,
    sale_date   Date,
    sale_price  UInt64,
    lat         Float64,
    lng         Float64,
    prop_type   LowCardinality(String),          -- detached/semi/terraced/flat/condo/single...
    beds        Nullable(UInt8)
)
ENGINE = MergeTree
ORDER BY (country, region, sale_date);

-- ─────────────────────────────────────────────────────────────────────────────
-- assessments — US assessor values (the number we test for over-assessment)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS overtaxed.assessments
(
    country         LowCardinality(String) DEFAULT 'US',
    region          LowCardinality(String),
    pin             String,
    tax_year        UInt16,
    assessed_value  UInt64,                       -- assessor's market value estimate
    lat             Float64,
    lng             Float64,
    class           LowCardinality(String),
    address         String
)
ENGINE = ReplacingMergeTree
ORDER BY (region, pin, tax_year);

-- ─────────────────────────────────────────────────────────────────────────────
-- parcels — geo + address dimension for US parcels (Parcel Universe ⋈ Addresses)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS overtaxed.parcels
(
    pin      String,
    lat      Float64,
    lng      Float64,
    address  String,
    zip      String,
    class    LowCardinality(String)
)
ENGINE = ReplacingMergeTree
ORDER BY pin;

-- ─────────────────────────────────────────────────────────────────────────────
-- uk_bands — per-address council-tax band, filled by the live VOA lookup task
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS overtaxed.uk_bands
(
    postcode      String,
    address       String,
    band          LowCardinality(String),        -- A..H
    lat           Float64,
    lng           Float64,
    council       String DEFAULT '',             -- billing authority (for Band D £ lookup)
    looked_up_at  DateTime DEFAULT now()
)
ENGINE = ReplacingMergeTree(looked_up_at)
ORDER BY (postcode, address);

-- band_thresholds — 1991 £ ranges per band (England), for back-casting
CREATE TABLE IF NOT EXISTS overtaxed.band_thresholds
(
    band     LowCardinality(String),
    min_1991 UInt32,
    max_1991 UInt32
)
ENGINE = MergeTree
ORDER BY band;

-- uk_band_d — real Band D council-tax amount per billing authority (gov.uk Table 7)
CREATE TABLE IF NOT EXISTS overtaxed.uk_band_d
(
    council  String,
    band_d   Float64,
    year     String DEFAULT '2024-25'
)
ENGINE = ReplacingMergeTree
ORDER BY council;
