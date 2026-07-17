"use server";

import { revalidatePath } from "next/cache";
import { saveProperty, fileAppeal } from "@/lib/portfolio";

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
