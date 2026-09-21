import { db } from "@/db";
import { recaps, users } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { normalizeHandle } from "./handle";
import { canViewProfile, isProfilePreview } from "./privacy";
import { recapOgPayload } from "./og-recap";

export async function getProfileForViewer(handle: string, viewerId: string | null) {
  const normalized = normalizeHandle(handle);
  if (!normalized) return null;

  const owner = await db.query.users.findFirst({
    where: eq(users.handle, normalized),
    columns: {
      id: true,
      name: true,
      handle: true,
      profilePublic: true,
      createdAt: true,
    },
  });
  if (!owner || !owner.handle) return null;
  if (!canViewProfile(owner, owner.id, viewerId)) return null;

  const rows = await db.query.recaps.findMany({
    where: and(eq(recaps.userId, owner.id), eq(recaps.isPublic, true)),
    orderBy: [desc(recaps.createdAt)],
  });

  return {
    handle: owner.handle,
    name: owner.name,
    createdAt: owner.createdAt,
    isOwnerPreview: isProfilePreview(owner, owner.id, viewerId),
    recaps: rows.map((row) => ({
      id: row.id,
      title: row.title,
      type: row.type,
      createdAt: row.createdAt,
      summary: recapOgPayload(row.title, row.data),
    })),
  };
}
