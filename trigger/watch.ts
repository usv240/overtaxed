import { schedules } from "@trigger.dev/sdk";
import { pgQuery } from "@/lib/postgres";
import { analyzeProperty } from "@/lib/queries";

/**
 * Scheduled Trigger.dev task — "watch my home".
 * Every morning it re-checks each saved property against the latest ClickHouse
 * analytics and records a snapshot in Postgres, so a homeowner is alerted if
 * their assessment (and overpayment) changes. Closes the OLTP → OLAP → OLTP loop
 * on a durable cron schedule.
 */
export const watchProperties = schedules.task({
  id: "watch-properties",
  cron: "0 8 * * *", // 08:00 UTC daily
  run: async () => {
    const saved = await pgQuery<{ id: number; pin: string | null; address: string }>(
      `SELECT id, pin, address FROM saved_properties WHERE country='US' AND pin IS NOT NULL`,
    );

    let checked = 0;
    let stillOverpaying = 0;
    for (const s of saved) {
      if (!s.pin) continue;
      const a = await analyzeProperty(s.pin);
      if (!a.found || !a.meta) continue;
      checked++;
      const overpay = a.meta.annualOverpay;
      if (overpay > 0) stillOverpaying++;
      await pgQuery(
        `INSERT INTO watch_snapshots (saved_property_id, address, annual_overpay) VALUES ($1, $2, $3)`,
        [s.id, s.address, overpay],
      );
    }

    return { checked, stillOverpaying, at: new Date().toISOString() };
  },
});
