"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { createSession, destroySession, purgeExpiredSessions } from "@/lib/auth/session";
import { isGuestLoginAllowed } from "@/lib/auth/current-user";
import { checkAuthRateLimit } from "@/lib/auth/rate-limit";
import { isValidTimezone } from "@/lib/timezone";
import {
  hashPassword, normalizeEmail, validateEmail, validatePassword, verifyPassword,
} from "@/lib/auth/password";

export interface AuthFormState {
  error?: string;
}

const GUEST_EMAIL = "guest@vinyl.audio";

/** Only allow redirects back to our own pages – never to an external URL. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim() || null;
  const requestedTimezone = String(formData.get("timezone") ?? "UTC");
  const timezone = isValidTimezone(requestedTimezone) ? requestedTimezone : "UTC";

  const emailError = validateEmail(email);
  if (emailError) return { error: emailError };
  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError };

  const rate = await checkAuthRateLimit(email);
  if (!rate.allowed) return { error: `Too many attempts. Try again in ${Math.ceil(rate.retryAfterSeconds / 60)} minutes.` };

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing) return { error: "An account with that email already exists. Try signing in." };

  const [user] = await db
    .insert(users)
    .values({ email, name, timezone, passwordHash: await hashPassword(password) })
    .returning();

  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");

  const rate = await checkAuthRateLimit(email);
  if (!rate.allowed) return { error: `Too many attempts. Try again in ${Math.ceil(rate.retryAfterSeconds / 60)} minutes.` };

  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  // Same message whether the email or the password is wrong, so the form can't be used
  // to discover which emails have accounts.
  const invalid = { error: "Incorrect email or password." };
  if (!user?.passwordHash) return invalid;
  if (!(await verifyPassword(password, user.passwordHash))) return invalid;

  await purgeExpiredSessions();
  await createSession(user.id);
  redirect(safeNext(formData.get("next")));
}

/**
 * Passwordless guest account for local development and previews.
 * Refuses to run unless ALLOW_GUEST_LOGIN=true, so it can't be triggered in production by accident.
 */
export async function signInAsGuest(): Promise<AuthFormState> {
  if (!isGuestLoginAllowed()) return { error: "Guest access is disabled on this server." };

  let user = await db.query.users.findFirst({ where: eq(users.email, GUEST_EMAIL) });
  if (!user) {
    [user] = await db.insert(users).values({ email: GUEST_EMAIL, name: "Guest Listener" }).returning();
  }
  await createSession(user.id);
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  await destroySession();
  redirect("/login");
}
