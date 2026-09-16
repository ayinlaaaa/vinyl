import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getOrCreateDefaultUser() {
  // Check if default user exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, "guest@vinyl.audio"),
  });

  if (existingUser) return existingUser;

  // Create default user
  const [newUser] = await db.insert(users).values({
    email: "guest@vinyl.audio",
    name: "Guest Listener",
  }).returning();

  return newUser;
}
