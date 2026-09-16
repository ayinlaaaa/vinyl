"use server";

import { db } from "@/db";
import { musicProviders, recaps } from "@/db/schema";
import { getOrCreateDefaultUser } from "@/lib/db-utils";
import { normalizeImport } from "@/lib/import-normalizer";
import { deleteUserHistory, insertListeningRows } from "@/lib/history-repo";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export interface ImportResult {
  success: boolean;
  error?: string;
  /** Rows written to the database. */
  inserted: number;
  /** Rows that were valid but already existed (from a previous import or sync). */
  alreadyExisted: number;
  /** Rows that appeared more than once within the uploaded file. */
  duplicatesInFile: number;
  /** Rows we could not use, with the first few reasons for the UI. */
  rejected: number;
  rejectionSamples: string[];
}

/** Hard cap so one upload cannot exhaust memory. Spotify exports are ~10k rows per file. */
const MAX_RECORDS = 200_000;

export async function importListeningHistory(data: unknown): Promise<ImportResult> {
  const empty: ImportResult = {
    success: false, inserted: 0, alreadyExisted: 0, duplicatesInFile: 0, rejected: 0, rejectionSamples: [],
  };

  try {
    if (Array.isArray(data) && data.length > MAX_RECORDS) {
      return { ...empty, error: `File has ${data.length} records; the limit is ${MAX_RECORDS}. Please split it.` };
    }

    const user = await getOrCreateDefaultUser();
    const { rows, rejected, duplicatesInFile } = normalizeImport(data, user.id);

    if (rows.length === 0) {
      const sample = rejected.slice(0, 3).map((r) => `row ${r.index}: ${r.reason}`);
      return {
        ...empty,
        rejected: rejected.length,
        duplicatesInFile,
        rejectionSamples: sample,
        error: "No usable listening records were found in this file.",
      };
    }

    const inserted = await insertListeningRows(rows);

    revalidatePath("/dashboard");
    return {
      success: true,
      inserted,
      alreadyExisted: rows.length - inserted,
      duplicatesInFile,
      rejected: rejected.length,
      rejectionSamples: rejected.slice(0, 3).map((r) => `row ${r.index}: ${r.reason}`),
    };
  } catch (error) {
    console.error("Import error:", error);
    return { ...empty, error: "The server could not process this file. Check the server logs for details." };
  }
}

/**
 * Remove everything belonging to the current user: history, saved recaps and
 * provider connections. Scoped by userId – never touches other users' rows.
 */
export async function clearAllData() {
  const user = await getOrCreateDefaultUser();
  await deleteUserHistory(user.id);
  await db.delete(recaps).where(eq(recaps.userId, user.id));
  await db.delete(musicProviders).where(eq(musicProviders.userId, user.id));
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  return { success: true };
}
