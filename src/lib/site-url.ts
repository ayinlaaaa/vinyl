/**
 * Canonical origin for Open Graph URLs and share links.
 * Prefer NEXT_PUBLIC_APP_URL in production so crawlers never see localhost.
 */
export function getSiteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) return new URL(explicit.endsWith("/") ? explicit : `${explicit}/`);
  if (process.env.VERCEL_URL) return new URL(`https://${process.env.VERCEL_URL}/`);
  return new URL("http://localhost:3000/");
}

export function absoluteUrl(path: string): string {
  return new URL(path.replace(/^\//, ""), getSiteUrl()).toString();
}
