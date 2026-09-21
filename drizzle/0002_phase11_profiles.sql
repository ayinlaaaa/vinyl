ALTER TABLE "users" ADD COLUMN "handle" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "recaps_public_by_default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_handle_idx" ON "users" USING btree ("handle");--> statement-breakpoint
CREATE INDEX "recaps_user_public_idx" ON "recaps" USING btree ("user_id","is_public");
