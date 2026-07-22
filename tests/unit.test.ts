import { test } from "node:test";
import assert from "node:assert/strict";
import { parseVoaBands } from "@/lib/voa";
import { bandFor1991, UK_BAND_FACTOR, bandIndex } from "@/lib/assumptions";
import {
  assessmentRatio, fairValue, annualOverpay, overAssessedPct,
  appealStrength, confidenceLevel, extrapolateCountyImpact,
} from "@/lib/analytics";
import { projectUsAnnual, projectUkAnnual } from "@/lib/impact";

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

// ── Assessment math (lib/analytics.ts) ────────────────────────────────────
test("assessmentRatio = assessed / market, guards divide-by-zero", () => {
  assert.equal(assessmentRatio(400090, 305000).toFixed(2), "1.31");
  assert.equal(assessmentRatio(100, 0), 0);
});

test("fairValue = market * local median ratio", () => {
  assert.ok(Math.abs(fairValue(305000, 0.81) - 247050) < 1e-6);
});

test("annualOverpay = (assessed - fair) * rate, floored at 0", () => {
  // Monticello demo: (400090 - 248362) * 2.5% ≈ 3793
  assert.equal(annualOverpay(400090, 248362, 0.025), 3793);
  // never negative when the home is under-assessed
  assert.equal(annualOverpay(200000, 260000, 0.025), 0);
});

test("overAssessedPct measures distance above the neighbourhood median", () => {
  // ratio 1.31 vs median 0.81 → ~62% over
  assert.equal(Math.round(overAssessedPct(1.31, 0.81) * 100), 62);
  assert.equal(overAssessedPct(1.0, 0), 0);
});

test("appealStrength buckets by how far over the median", () => {
  assert.equal(appealStrength(0.62), "strong");
  assert.equal(appealStrength(0.08), "moderate");
  assert.equal(appealStrength(0.03), "weak");
  assert.equal(appealStrength(0.0), "none");
  assert.equal(appealStrength(-0.2), "none");
});

test("confidenceLevel is highest with own-sale + many comps", () => {
  assert.equal(confidenceLevel(false, 5), "high");   // own sale + 4+ comps
  assert.equal(confidenceLevel(true, 5), "medium");  // comps-only, still plenty
  assert.equal(confidenceLevel(true, 3), "medium");
  assert.equal(confidenceLevel(true, 1), "low");
});

test("extrapolateCountyImpact scales measured harm by parcels/sold", () => {
  // $1M measured on 10k sold, scaled to 100k parcels → $10M
  assert.equal(extrapolateCountyImpact(1_000_000, 100_000, 10_000), 10_000_000);
  assert.equal(extrapolateCountyImpact(1_000_000, 100_000, 0), 0);
});

// ── National impact projection (lib/impact.ts) ────────────────────────────
test("projectUsAnnual scales Cook figure by owner-occupied homes (tens of billions)", () => {
  const us = projectUsAnnual(460_000_000);
  assert.ok(us > 15_000_000_000 && us < 30_000_000_000, `expected ~$20B, got ${us}`);
  assert.equal(projectUsAnnual(0), 0);
});

test("projectUkAnnual = misbanded homes × one-band error", () => {
  assert.equal(projectUkAnnual(), 80_000_000);
});
