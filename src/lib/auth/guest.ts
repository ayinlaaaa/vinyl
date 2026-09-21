/** Shared passwordless account used when ALLOW_GUEST_LOGIN=true. Not safe to delete. */
export const GUEST_EMAIL = "guest@vinyl.audio";

export function isGuestEmail(email: string): boolean {
  return email === GUEST_EMAIL;
}
