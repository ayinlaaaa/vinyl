/** Public profile URL slugs. Stored lowercase; null means the user has not claimed one. */

export const HANDLE_MIN = 3;
export const HANDLE_MAX = 24;

/** Route segments and product words that must never be claimable as a handle. */
export const RESERVED_HANDLES = new Set([
  "about",
  "account",
  "admin",
  "api",
  "app",
  "apple",
  "auth",
  "collection",
  "dashboard",
  "demo",
  "features",
  "guest",
  "health",
  "help",
  "history",
  "import",
  "lastfm",
  "listen",
  "listener",
  "login",
  "me",
  "music",
  "null",
  "og",
  "privacy",
  "profile",
  "public",
  "recap",
  "settings",
  "signup",
  "spotify",
  "static",
  "support",
  "u",
  "undefined",
  "user",
  "users",
  "vinyl",
  "wrapped",
  "www",
]);

export function normalizeHandle(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * Returns a user-facing error, or null if the handle is well-formed.
 * Does not check uniqueness — that needs the database.
 */
export function validateHandle(input: string): string | null {
  const handle = normalizeHandle(input);
  if (handle.length < HANDLE_MIN || handle.length > HANDLE_MAX) {
    return `Handle must be ${HANDLE_MIN}–${HANDLE_MAX} characters.`;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(handle)) {
    return "Use lowercase letters, numbers, and single hyphens. Cannot start or end with a hyphen.";
  }
  if (RESERVED_HANDLES.has(handle)) {
    return "That handle is reserved.";
  }
  return null;
}
