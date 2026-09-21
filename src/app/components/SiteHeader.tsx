"use client";

import { useState } from "react";
import Link from "next/link";
import { Disc, Menu, X } from "lucide-react";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="px-6 py-8 md:px-12">
      <nav className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Disc className="w-8 h-8 text-vu" />
          <span className="text-xl font-bold tracking-tighter uppercase font-playfair">Vinyl</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide uppercase text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
          <Link href="#about" className="hover:text-foreground transition-colors">About</Link>
          <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
          <Link href="/signup" className="px-5 py-2 bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
            Get started
          </Link>
        </div>
        <button
          type="button"
          className="md:hidden p-2 -mr-2 hover:bg-secondary transition-colors"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </nav>
      {open && (
        <div className="md:hidden mt-6 flex flex-col gap-4 text-sm font-medium tracking-wide uppercase text-muted-foreground border-t border-border pt-6">
          <Link href="#features" onClick={() => setOpen(false)} className="hover:text-foreground">Features</Link>
          <Link href="#about" onClick={() => setOpen(false)} className="hover:text-foreground">About</Link>
          <Link href="/login" className="hover:text-foreground">Sign in</Link>
          <Link href="/signup" className="px-5 py-3 bg-primary text-primary-foreground text-center">
            Get started
          </Link>
        </div>
      )}
    </header>
  );
}
