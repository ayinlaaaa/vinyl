import { Disc, LayoutDashboard, History, Library, Settings } from "lucide-react";
import Link from "next/link";
import SidebarNav from "./SidebarNav";

// Every dashboard page reads live data from the database, so it must be rendered
// per request – never pre-rendered at build time.
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

        <div className="p-4 border-t border-border">
          {/* No authentication exists yet – this is a single shared guest account. */}
          <p className="px-4 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Guest listener
          </p>
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
