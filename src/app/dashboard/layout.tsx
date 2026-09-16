import { Disc, LayoutDashboard, History, Library, Settings } from "lucide-react";
import Link from "next/link";
import SidebarNav from "./SidebarNav";
import { requireUser } from "@/lib/auth/current-user";
import { signOut } from "@/app/actions/auth";
import { LogOut } from "lucide-react";

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
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border flex flex-col sticky top-0 h-screen">
        <div className="p-8 flex items-center gap-2">
          <Disc className="w-6 h-6" />
          <span className="text-lg font-bold tracking-tighter uppercase font-playfair">Vinyl</span>
        </div>
        
        <SidebarNav
          items={[
            { href: "/dashboard", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
            { href: "/dashboard/history", label: "History", icon: <History className="w-4 h-4" /> },
            { href: "/dashboard/collection", label: "Collection", icon: <Library className="w-4 h-4" /> },
            { href: "/dashboard/settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
          ]}
        />

        <div className="p-4 border-t border-border space-y-3">
          <div className="px-4 min-w-0">
            <p className="text-sm font-medium truncate">{user.name ?? "Listener"}</p>
            <p className="text-[10px] font-mono text-muted-foreground truncate">{user.email}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-3 px-4 py-2 w-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
