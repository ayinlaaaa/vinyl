import "server-only";
import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "./session";

export type { SessionUser };

/**
 * Get the signed-in user for the current request, or null.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  return getSessionUser();
}

/**
 * Like getCurrentUser but redirects to /login when nobody is signed in.
 * Use this in every dashboard page and every server action that touches user data.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Dev/preview convenience: a passwordless guest account. Disabled unless ALLOW_GUEST_LOGIN=true. */
export function isGuestLoginAllowed(): boolean {
  return process.env.ALLOW_GUEST_LOGIN === "true";
}
