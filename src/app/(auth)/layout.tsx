import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Already signed in? No reason to see the login page.
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      {children}
    </main>
  );
}
