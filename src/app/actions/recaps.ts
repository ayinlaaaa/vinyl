"use server";

import { db } from "@/db";
import { recaps, users } from "@/db/schema";
import { getCurrentUser, requireUser } from "@/lib/auth/current-user";
import { generateWrappedData } from "@/lib/wrapped-service";
import { canViewRecap } from "@/lib/privacy";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function revalidateSharing(userId: string, recapId: string) {
  revalidatePath(`/recap/${recapId}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/wrapped");
  const owner = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (owner?.handle) revalidatePath(`/u/${owner.handle}`);
}

export async function saveCurrentYearRecap() {
  const user = await requireUser();
  const year = new Date().getFullYear();

  try {
    const data = await generateWrappedData(user.id, year);
    if (!data) {
      return { success: false as const, error: "Not enough listening data to build a recap for this year." };
    }

    const existing = await db.query.recaps.findFirst({
      where: and(
        eq(recaps.userId, user.id),
        eq(recaps.type, "yearly"),
        eq(recaps.title, `Vinyl ${year}`),
      ),
    });

    if (existing) {
      const [updated] = await db.update(recaps)
        .set({ data, updatedAt: new Date() })
        .where(eq(recaps.id, existing.id))
        .returning();
      await revalidateSharing(user.id, updated.id);
      return { success: true as const, id: updated.id, isPublic: updated.isPublic };
    }

    const [inserted] = await db.insert(recaps).values({
      userId: user.id,
      title: `Vinyl ${year}`,
      type: "yearly",
      data,
      isPublic: user.recapsPublicByDefault,
      updatedAt: new Date(),
    }).returning();

    await revalidateSharing(user.id, inserted.id);
    return { success: true as const, id: inserted.id, isPublic: inserted.isPublic };
  } catch (error) {
    console.error("Save recap error:", error);
    return { success: false as const, error: "Failed to save recap" };
  }
}

export async function toggleRecapVisibility(id: string, isPublic: boolean) {
  const user = await requireUser();

  const [updated] = await db.update(recaps)
    .set({ isPublic, updatedAt: new Date() })
    .where(and(
      eq(recaps.id, id),
      eq(recaps.userId, user.id),
    ))
    .returning();

  if (!updated) {
    return { success: false as const, error: "Recap not found." };
  }

  await revalidateSharing(user.id, id);
  return { success: true as const, isPublic: updated.isPublic };
}

/** Public recaps only — used by OG images and unauthenticated crawlers. */
export async function getPublicRecap(id: string) {
  const recap = await db.query.recaps.findFirst({
    where: and(
      eq(recaps.id, id),
      eq(recaps.isPublic, true),
    ),
  });

  return recap || null;
}

/**
 * Recap visible to this request: public ones for anyone, private ones only for the owner.
 * Never returns the owner's email.
 */
export async function getRecapForViewer(id: string) {
  const recap = await db.query.recaps.findFirst({
    where: eq(recaps.id, id),
  });
  if (!recap) return null;

  const viewer = await getCurrentUser();
  if (!canViewRecap(recap, viewer?.id ?? null)) return null;

  const owner = await db.query.users.findFirst({
    where: eq(users.id, recap.userId),
    columns: { handle: true, name: true, profilePublic: true },
  });

  return {
    recap,
    isOwner: viewer?.id === recap.userId,
    owner: owner ?? { handle: null, name: null, profilePublic: false },
  };
}
