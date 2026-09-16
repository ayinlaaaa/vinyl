import { db } from "@/db";
import { listeningHistory } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import type { NewListeningRow } from "./listening";

const BATCH_SIZE = 500;

/**
 * Insert listening rows, silently skipping any whose (userId, externalId) already exists.
 * Returns the number of rows actually inserted. One round-trip per 500 rows instead of
 * one SELECT + one INSERT per row.
 */
export async function insertListeningRows(rows: NewListeningRow[]): Promise<number> {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const result = await db
      .insert(listeningHistory)
      .values(batch)
      .onConflictDoNothing({ target: [listeningHistory.userId, listeningHistory.externalId] })
      .returning({ id: listeningHistory.id });
    inserted += result.length;
  }
  return inserted;
}

/** Delete one user's history, optionally restricted to a single provider. */
export async function deleteUserHistory(userId: string, provider?: string): Promise<void> {
  await db
    .delete(listeningHistory)
    .where(
      provider
        ? and(eq(listeningHistory.userId, userId), eq(listeningHistory.provider, provider))
        : eq(listeningHistory.userId, userId)
    );
}
