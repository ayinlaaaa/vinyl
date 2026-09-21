ALTER TABLE "listening_history" ADD COLUMN "track_key" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "listening_history" ADD COLUMN "artist_key" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "timezone" text DEFAULT 'UTC' NOT NULL;