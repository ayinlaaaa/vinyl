"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth/current-user";
import { isGuestEmail } from "@/lib/auth/guest";
import { verifyPassword } from "@/lib/auth/password";
import { destroySession } from "@/lib/auth/session";
import { normalizeHandle, validateHandle } from "@/lib/handle";
import { isValidTimezone } from "@/lib/timezone";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: string }).code === "23505";
}

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

export async function updateProfile(input: {
  name: string;
  handle: string;
  profilePublic: boolean;
  recapsPublicByDefault: boolean;
}) {
  const user = await requireUser();
  const name = input.name.trim() || null;
  const handleRaw = input.handle.trim();

  let handle: string | null = null;
  if (handleRaw) {
    const error = validateHandle(handleRaw);
    if (error) return { success: false as const, error };
    handle = normalizeHandle(handleRaw);

    const taken = await db.query.users.findFirst({
      where: and(eq(users.handle, handle), ne(users.id, user.id)),
    });
    if (taken) return { success: false as const, error: "That handle is already taken." };
  }

  const profilePublic = Boolean(input.profilePublic) && handle !== null;
  if (input.profilePublic && !handle) {
    return { success: false as const, error: "Choose a handle before making your profile public." };
  }

  try {
    await db.update(users)
      .set({
        name,
        handle,
        profilePublic,
        recapsPublicByDefault: Boolean(input.recapsPublicByDefault),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { success: false as const, error: "That handle is already taken." };
    }
    throw error;
  }

  if (user.handle && user.handle !== handle) revalidatePath(`/u/${user.handle}`);
  if (handle) revalidatePath(`/u/${handle}`);
  revalidatePath("/dashboard/settings");
  return { success: true as const, handle, profilePublic };
}

/**
 * Permanently delete the signed-in account and all cascaded rows (history, recaps,
 * sessions, provider connections). The shared guest account cannot be deleted.
 */
export async function deleteAccount(formData: FormData): Promise<{ error?: string }> {
  const user = await requireUser();
  if (isGuestEmail(user.email)) {
    return { error: "The shared guest account cannot be deleted." };
  }
  if (String(formData.get("confirm") ?? "").trim() !== "DELETE") {
    return { error: "Type DELETE to confirm." };
  }
  if (user.passwordHash) {
    const password = String(formData.get("password") ?? "");
    if (!(await verifyPassword(password, user.passwordHash))) {
      return { error: "Incorrect password." };
    }
  }

  const handle = user.handle;
  await destroySession();
  await db.delete(users).where(eq(users.id, user.id));
  if (handle) revalidatePath(`/u/${handle}`);
  redirect("/");
}
