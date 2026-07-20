import { test } from "node:test";
import assert from "node:assert/strict";
import { parseVoaBands } from "@/lib/voa";
import { bandFor1991, UK_BAND_FACTOR, bandIndex } from "@/lib/assumptions";

test("bandFor1991 maps 1991 values to the correct statutory band", () => {
  assert.equal(bandFor1991(30000), "A");
  assert.equal(bandFor1991(87000), "D"); // 68,001–88,000
  assert.equal(bandFor1991(100000), "E"); // 88,001–120,000
  assert.equal(bandFor1991(5_000_000), "H");
});

test("UK band factors are the statutory ratios vs Band D", () => {
  assert.equal(UK_BAND_FACTOR.D, 1);
  assert.equal(UK_BAND_FACTOR.A, 6 / 9);
  assert.equal(UK_BAND_FACTOR.H, 18 / 9);
  // E is 11/9 of D — so a Band E home pays ~22% more than Band D
  assert.ok(UK_BAND_FACTOR.E > UK_BAND_FACTOR.D);
});

test("bandIndex orders A..H", () => {
  assert.equal(bandIndex.A, 1);
  assert.equal(bandIndex.E, 5);
  assert.ok(bandIndex.E > bandIndex.D);
});

test("parseVoaBands extracts address/band/council and skips non-band rows", () => {
  const html = `
    <table>
      <tr class="govuk-table__row">
        <td class="govuk-table__cell"><a title="x">12 LAVENDER SWEEP, LONDON, SW11 1DX</a></td>
        <td class="govuk-table__cell">E</td>
        <td class="govuk-table__cell"><a href="#">Wandsworth</a></td>
      </tr>
      <tr class="govuk-table__row">
        <td class="govuk-table__cell"><a title="x">14 LAVENDER SWEEP, LONDON, SW11 1DX</a></td>
        <td class="govuk-table__cell">Deleted</td>
        <td class="govuk-table__cell"><a href="#">Wandsworth</a></td>
      </tr>
    </table>`;
  const rows = parseVoaBands(html);
  assert.equal(rows.length, 1); // the "Deleted" row is skipped
  assert.deepEqual(rows[0], {
    address: "12 LAVENDER SWEEP, LONDON, SW11 1DX",
    band: "E",
    council: "Wandsworth",
  });
});
