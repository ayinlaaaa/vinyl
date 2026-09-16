import { Disc, LayoutDashboard, History, Library, Settings, LogOut, Search, Bell } from "lucide-react";
import Link from "next/link";

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
        
        <nav className="flex-1 px-4 space-y-2">
          <NavItem href="/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label="Overview" active />
          <NavItem href="/dashboard/history" icon={<History className="w-4 h-4" />} label="History" />
          <NavItem href="/dashboard/collection" icon={<Library className="w-4 h-4" />} label="Collection" />
          <NavItem href="/dashboard/settings" icon={<Settings className="w-4 h-4" />} label="Settings" />
        </nav>

        <div className="p-4 border-t border-border">
          <button className="flex items-center gap-3 px-4 py-2 w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-border flex items-center justify-between px-8">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search your collection..." 
              className="w-full bg-secondary/50 border-none rounded-none py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-secondary transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
            </button>
            <div className="w-8 h-8 bg-zinc-800 rounded-none"></div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavItem({ href, icon, label, active = false }: { href: string, icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors ${
        active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
