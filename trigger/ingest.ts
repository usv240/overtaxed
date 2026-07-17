import { task } from "@trigger.dev/sdk";
import { ch } from "@/lib/clickhouse";

/**
 * INGESTION — Trigger.dev orchestrates, ClickHouse `url()` does zero-ETL.
 *
 * The heavy lift (pull 100s of MB of gov CSV, parse, insert millions of rows)
 * happens server-side in ClickHouse via url(); Trigger.dev provides the durable,
 * retryable, long-running orchestration around it. Both tools, meaningfully.
 */

const LR_SCHEMA =
  "guid String, price UInt32, date String, postcode String, ptype String, " +
  "old_new String, duration String, paon String, saon String, street String, " +
  "locality String, town String, district String, county String, ppd String, status String";

const lrUrl = (year: number) =>
  `http://prod.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com/pp-${year}.csv`;

/** Ingest one year of HM Land Registry Price Paid Data into `sales`. */
export const ingestUkLandRegistry = task({
  id: "ingest-uk-land-registry",
  maxDuration: 3600,
  run: async (payload: { year?: number }) => {
    const year = payload.year ?? 2023;
    const client = ch();

    // idempotent re-runs: clear this year first (lightweight delete)
    await client.command({
      query: `DELETE FROM overtaxed.sales WHERE country='UK' AND toYear(sale_date)=${year}`,
    });

    const started = Date.now();
    await client.command({
      query: `
        INSERT INTO overtaxed.sales
          (country, region, txn_id, pin, address, postcode, sale_date, sale_price, lat, lng, prop_type, beds)
        SELECT
          'UK',
          county,
          guid,
          '',
          concat_ws(', ', trimBoth(concat_ws(' ', paon, street)), town),
          postcode,
          toDate(substring(date, 1, 10)),
          price,
          0, 0,
          multiIf(ptype='D','detached', ptype='S','semi', ptype='T','terraced', ptype='F','flat','other'),
          NULL
        FROM url('${lrUrl(year)}', 'CSV', '${LR_SCHEMA}')
        SETTINGS max_http_get_redirects=10`,
    });

    const rs = await client.query({
      query: `SELECT count() AS c FROM overtaxed.sales WHERE country='UK' AND toYear(sale_date)=${year}`,
      format: "JSONEachRow",
    });
    const [{ c }] = (await rs.json()) as { c: string }[];

    return { year, rowsIngested: Number(c), elapsedSec: Math.round((Date.now() - started) / 1000) };
  },
});
