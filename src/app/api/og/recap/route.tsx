import { GET as getRecapImage } from "./[id]/route";

/** Documented alias: `/api/og/recap?id=<uuid>` → `/api/og/recap/<uuid>`. */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) return new Response("Missing id", { status: 400 });
  return getRecapImage(request, { params: Promise.resolve({ id }) });
}
