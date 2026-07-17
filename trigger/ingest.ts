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

    // idempotent re-runs: clear this year first (but keep curated mock rows: txn_id like 'U%')
    await client.command({
      query: `DELETE FROM overtaxed.sales WHERE country='UK' AND toYear(sale_date)=${year} AND txn_id NOT LIKE 'U%'`,
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

// ── Cook County (US) — assessed values + arms-length residential sales ──
// Socrata open data. certified_tot is assessed at 10% → market value = ×10.
const socrata = (dataset: string, select: string, where: string, limit: number) => {
  const p = new URLSearchParams({ $select: select, $where: where, $limit: String(limit) });
  return `https://datacatalog.cookcountyil.gov/resource/${dataset}.csv?${p.toString()}`;
};

/** Ingest one year of Cook County assessments + arms-length residential sales. */
export const ingestCookCounty = task({
  id: "ingest-cook-county",
  maxDuration: 3600,
  run: async (payload: { year?: number }) => {
    const year = payload.year ?? 2023;
    const client = ch();
    const started = Date.now();
    const armsLength =
      `sale_filter_less_than_10k='false' AND sale_filter_deed_type='false' AND sale_filter_same_sale_within_365='false'`;

    // sales (keep curated seed rows: pin like 'P%')
    await client.command({
      query: `DELETE FROM overtaxed.sales WHERE country='US' AND region='Cook County' AND pin NOT LIKE 'P%' AND toYear(sale_date)=${year}`,
    });
    const salesUrl = socrata(
      "wvhk-k5uv",
      "pin,sale_date,sale_price,class",
      `year='${year}' AND starts_with(class,'2') AND ${armsLength}`,
      1_000_000,
    );
    await client.command({
      query: `
        INSERT INTO overtaxed.sales
          (country, region, txn_id, pin, address, postcode, sale_date, sale_price, lat, lng, prop_type, beds)
        SELECT 'US','Cook County', concat('CC',pin), pin, '', '',
               toDate(substring(sale_date,1,10)), toUInt64(sale_price), 0, 0, 'single', NULL
        FROM url('${salesUrl}', 'CSVWithNames',
             'pin String, sale_date String, sale_price String, class String')
        WHERE toUInt64OrZero(sale_price) > 10000`,
    });

    // assessments (market value = certified_tot × 10)
    await client.command({
      query: `DELETE FROM overtaxed.assessments WHERE region='Cook County' AND pin NOT LIKE 'P%' AND tax_year=${year}`,
    });
    const assessUrl = socrata(
      "uzyt-m557",
      "pin,class,township_name,certified_tot",
      `year='${year}' AND starts_with(class,'2') AND certified_tot>'0'`,
      3_000_000,
    );
    await client.command({
      query: `
        INSERT INTO overtaxed.assessments
          (region, pin, tax_year, assessed_value, lat, lng, class, address)
        SELECT 'Cook County', pin, ${year}, toUInt64(certified_tot)*10, 0, 0, class, township_name
        FROM url('${assessUrl}', 'CSVWithNames',
             'pin String, class String, township_name String, certified_tot String')
        WHERE toUInt64OrZero(certified_tot) > 0`,
    });

    const rs = await client.query({
      query: `SELECT
        (SELECT count() FROM overtaxed.sales WHERE region='Cook County' AND pin NOT LIKE 'P%' AND toYear(sale_date)=${year}) AS sales,
        (SELECT count() FROM overtaxed.assessments WHERE region='Cook County' AND pin NOT LIKE 'P%' AND tax_year=${year}) AS assessments`,
      format: "JSONEachRow",
    });
    const [counts] = (await rs.json()) as { sales: string; assessments: string }[];
    return { year, sales: Number(counts.sales), assessments: Number(counts.assessments), elapsedSec: Math.round((Date.now() - started) / 1000) };
  },
});

/** Ingest Cook County parcel geo + address (Parcel Universe ⋈ Parcel Addresses). */
export const ingestCookParcels = task({
  id: "ingest-cook-parcels",
  maxDuration: 3600,
  run: async (payload: { year?: number }) => {
    const year = payload.year ?? 2023;
    const client = ch();
    const started = Date.now();

    const universeUrl = socrata(
      "nj4t-kc8j",
      "pin,lat,lon,class",
      `year='${year}' AND starts_with(class,'2') AND lat IS NOT NULL`,
      3_000_000,
    );
    const addressUrl = socrata(
      "3723-97qp",
      "pin,prop_address_full,prop_address_city_name,prop_address_zipcode_1",
      `year='${year}' AND prop_address_full IS NOT NULL`,
      3_000_000,
    );

    await client.command({ query: `TRUNCATE TABLE IF EXISTS overtaxed.parcels` });
    await client.command({
      query: `
        INSERT INTO overtaxed.parcels (pin, lat, lng, address, zip, class)
        SELECT u.pin, u.lat, u.lon,
               concat(a.prop_address_full, ', ', a.prop_address_city_name, ' IL') AS address,
               a.prop_address_zipcode_1 AS zip, u.class
        FROM url('${universeUrl}', 'CSVWithNames', 'pin String, lat Float64, lon Float64, class String') AS u
        INNER JOIN url('${addressUrl}', 'CSVWithNames', 'pin String, prop_address_full String, prop_address_city_name String, prop_address_zipcode_1 String') AS a
          ON u.pin = a.pin
        WHERE u.lat != 0 AND a.prop_address_full != ''`,
    });

    const rs = await client.query({
      query: `SELECT count() AS c FROM overtaxed.parcels`,
      format: "JSONEachRow",
    });
    const [{ c }] = (await rs.json()) as { c: string }[];
    return { year, parcels: Number(c), elapsedSec: Math.round((Date.now() - started) / 1000) };
  },
});
