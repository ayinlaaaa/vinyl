import { pgTable, text, timestamp, uuid, integer, jsonb, boolean, index, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  imageUrl: text("image_url"),
  /** scrypt hash in the form "salt:hash" (hex). Null for accounts that have no password (e.g. dev guest). */
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  /** IANA zone used for calendar analytics (for example, America/New_York). */
  timezone: text("timezone").default("UTC").notNull(),
  /** Public URL slug (`/u/[handle]`). Null until the user claims one. */
  handle: text("handle"),
  /** When false, `/u/[handle]` 404s for everyone except the owner. */
  profilePublic: boolean("profile_public").default(false).notNull(),
  /** New recaps start public when true. Existing recaps are unchanged. */
  recapsPublicByDefault: boolean("recaps_public_by_default").default(false).notNull(),
}, (table) => [
  uniqueIndex("users_handle_idx").on(table.handle),
]);

/**
 * Server-side sessions. The browser only holds a random opaque token in an httpOnly cookie;
 * we store the SHA-256 of that token so a database leak does not expose live sessions.
 */
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("sessions_user_idx").on(table.userId),
]);

export const musicProviders = pgTable("music_providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  provider: text("provider", { enum: ["spotify", "lastfm", "apple"] }).notNull(),
  providerUserId: text("provider_user_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  isConnected: boolean("is_connected").default(true).notNull(),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const listeningHistory = pgTable("listening_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  provider: text("provider").notNull(), // 'spotify', 'lastfm', 'apple', 'import'
  
  trackName: text("track_name").notNull(),
  artistName: text("artist_name").notNull(),
  /** Canonical keys keep version suffixes and casing from splitting analytics. */
  trackKey: text("track_key").notNull().default(""),
  artistKey: text("artist_key").notNull().default(""),
  albumName: text("album_name"),
  albumArtUrl: text("album_art_url"),
  
  playedAt: timestamp("played_at").notNull(),
  durationMs: integer("duration_ms"),
  
  // To avoid duplicates during syncs
  externalId: text("external_id"), 
  
  // Extra provider-specific data
  metadata: jsonb("metadata"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  // One play per (user, externalId). This is what makes imports and syncs idempotent:
  // re-running them hits ON CONFLICT DO NOTHING instead of doubling every statistic.
  uniqueIndex("listening_history_user_external_idx").on(table.userId, table.externalId),
  // Every dashboard query is "this user's plays, newest first".
  index("listening_history_user_played_idx").on(table.userId, table.playedAt),
]);

export const recaps = pgTable("recaps", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(), // 'yearly', 'monthly', 'custom'
  data: jsonb("data").notNull(), // The calculated stats
  config: jsonb("config"), // Visual configuration
  isPublic: boolean("is_public").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("recaps_user_public_idx").on(table.userId, table.isPublic),
]);
