"use server";

import { db } from "@/db";
import { recaps } from "@/db/schema";
import { getOrCreateDefaultUser } from "@/lib/db-utils";
import { generateWrappedData } from "@/lib/wrapped-service";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function saveCurrentYearRecap() {
  const user = await getOrCreateDefaultUser();
  const year = new Date().getFullYear();

  try {
    const data = await generateWrappedData(user.id, year);
    
    // Check if a recap for this year already exists
    const existing = await db.query.recaps.findFirst({
      where: and(
        eq(recaps.userId, user.id),
        eq(recaps.type, "yearly"),
        eq(recaps.title, `Vinyl ${year}`)
      )
    });

    if (existing) {
      const [updated] = await db.update(recaps)
        .set({ data: data as any, updatedAt: new Date() })
        .where(eq(recaps.id, existing.id))
        .returning();
      return { success: true, id: updated.id };
    }

    const [inserted] = await db.insert(recaps).values({
      userId: user.id,
      title: `Vinyl ${year}`,
      type: "yearly",
      data: data as any,
      updatedAt: new Date(),
    }).returning();

    return { success: true, id: inserted.id };
  } catch (error) {
    console.error("Save recap error:", error);
    return { success: false, error: "Failed to save recap" };
  }
}

export async function toggleRecapVisibility(id: string, isPublic: boolean) {
  const user = await getOrCreateDefaultUser();
  
  await db.update(recaps)
    .set({ isPublic, updatedAt: new Date() })
    .where(and(
      eq(recaps.id, id),
      eq(recaps.userId, user.id)
    ));
    
  revalidatePath(`/recap/${id}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getPublicRecap(id: string) {
  const recap = await db.query.recaps.findFirst({
    where: and(
      eq(recaps.id, id),
      eq(recaps.isPublic, true)
    ),
  });

  return recap || null;
}
