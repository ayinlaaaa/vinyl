"use client";

import { useEffect, useState } from "react";
import { Disc, History, LayoutDashboard, Library, LogOut, Menu, Settings, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import SidebarNav from "./SidebarNav";

export default function DashboardShell({
  userName,
  userEmail,
  children,
}: {
  userName: string | null;
  userEmail: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const navItems = [
    { href: "/dashboard", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: "/dashboard/history", label: "History", icon: <History className="w-4 h-4" /> },
    { href: "/dashboard/collection", label: "Collection", icon: <Library className="w-4 h-4" /> },
    { href: "/dashboard/wrapped", label: "Recap", icon: <Sparkles className="w-4 h-4" /> },
    { href: "/dashboard/settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      <header className="md:hidden fixed top-0 inset-x-0 z-40 h-14 border-b border-border bg-background/95 backdrop-blur flex items-center justify-between px-4">
        <button
          type="button"
          className="p-2 -ml-2 hover:bg-secondary transition-colors"
          aria-expanded={open}
          aria-controls="dashboard-sidebar"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <Disc className="w-5 h-5 text-vu" />
          <span className="text-sm font-bold tracking-tighter uppercase font-playfair">Vinyl</span>
        </Link>
        <form action={signOut}>
          <button type="submit" className="p-2 -mr-2 hover:bg-secondary transition-colors" aria-label="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </header>

      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="md:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        id="dashboard-sidebar"
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 border-r border-border bg-background flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-8 flex items-center gap-2">
          <Disc className="w-6 h-6 text-vu" />
          <span className="text-lg font-bold tracking-tighter uppercase font-playfair">Vinyl</span>
        </div>

        <SidebarNav items={navItems} onNavigate={() => setOpen(false)} />

        <div className="p-4 border-t border-border space-y-3">
          <div className="px-4 min-w-0">
            <p className="text-sm font-medium truncate">{userName ?? "Listener"}</p>
            <p className="text-[10px] font-mono text-muted-foreground truncate">{userEmail}</p>
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

      <div className="flex-1 flex flex-col min-w-0 pt-14 md:pt-0">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
