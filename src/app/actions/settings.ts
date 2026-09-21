"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth/current-user";
import { isValidTimezone } from "@/lib/timezone";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateTimezone(timezone: string) {
  const user = await requireUser();
  if (!isValidTimezone(timezone)) {
    return { success: false, error: "Choose a valid IANA timezone, such as America/New_York." };
  }

  await db.update(users)
    .set({ timezone, updatedAt: new Date() })
    .where(eq(users.id, user.id));

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/history");
  revalidatePath("/dashboard/wrapped");
  revalidatePath("/dashboard/settings");
  return { success: true };
}
