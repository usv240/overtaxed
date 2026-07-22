"use server";

import { revalidatePath } from "next/cache";
import { saveProperty, fileAppeal } from "@/lib/portfolio";

/** Enrol a home for monitoring (OLTP): the scheduled Trigger.dev task re-checks it. */
export async function watchPropertyAction(input: {
  pin?: string | null; address: string; country: string; region?: string | null;
}) {
  await saveProperty({
    country: input.country, pin: input.pin ?? null, address: input.address, region: input.region ?? null,
  });
  revalidatePath("/portfolio");
  return { ok: true };
}

/** Persist an appeal (OLTP): save the property + create a filed appeal. */
export async function fileAppealAction(input: {
  pin?: string | null; address: string; country: string; region?: string | null;
  jurisdiction: string; estimatedAnnualSaving: number;
}) {
  await saveProperty({
    country: input.country, pin: input.pin ?? null, address: input.address, region: input.region ?? null,
  });
  const id = await fileAppeal({
    pin: input.pin ?? null, address: input.address, jurisdiction: input.jurisdiction,
    estimatedAnnualSaving: input.estimatedAnnualSaving,
  });
  revalidatePath("/portfolio");
  return { ok: true, id };
}
