"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

export default function SidebarNav({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-4 space-y-2" aria-label="Dashboard">
      {items.map((item) => {
        // "/dashboard" must match exactly, otherwise it would highlight for every sub-page.
        const active = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors ${
              active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
