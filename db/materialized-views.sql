-- Overtaxed — materialized view maintaining the latest sale per parcel.
-- AggregatingMergeTree keeps argMax(price, date) incrementally as new sales land,
-- so the hot analytical paths (regressivity, leaderboard) read a precomputed state
-- instead of scanning + grouping millions of raw sales each time.

CREATE TABLE IF NOT EXISTS overtaxed.latest_sales
(
    pin String,
    sp  AggregateFunction(argMax, UInt64, Date)
)
ENGINE = AggregatingMergeTree
ORDER BY pin;

CREATE MATERIALIZED VIEW IF NOT EXISTS overtaxed.latest_sales_mv TO overtaxed.latest_sales AS
SELECT pin, argMaxState(sale_price, sale_date) AS sp
FROM overtaxed.sales
GROUP BY pin;

-- backfill existing rows (the MV only sees inserts made after it is created)
INSERT INTO overtaxed.latest_sales
SELECT pin, argMaxState(sale_price, sale_date) AS sp
FROM overtaxed.sales
GROUP BY pin;
