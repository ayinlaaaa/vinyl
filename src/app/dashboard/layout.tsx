import DashboardShell from "./DashboardShell";
import { requireUser } from "@/lib/auth/current-user";

// Every dashboard page reads live data from the database, so it must be rendered
// per request – never pre-rendered at build time.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirects to /login when there is no valid session. Every page under /dashboard
  // and every server action also calls requireUser() itself – defence in depth.
  const user = await requireUser();

  return (
    <DashboardShell userName={user.name} userEmail={user.email}>
      {children}
    </DashboardShell>
  );
}
