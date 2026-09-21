import Link from "next/link";
import { ArrowRight, Disc, BarChart3, Share2, Shield } from "lucide-react";
import SiteHeader from "@/app/components/SiteHeader";
import VuMeter from "@/app/components/VuMeter";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />

      <main className="flex-1">
        <section className="px-6 py-20 md:px-12 md:py-32 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h1 className="text-6xl md:text-8xl font-playfair font-black tracking-tight leading-[0.9] mb-8">
                HIGH <br /> FIDELITY <br /> <span className="text-vu italic">ANALYTICS.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-md leading-relaxed mb-10">
                A sophisticated music listening platform for the audiophile. Explore your history with precision and timeless design.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-vu text-vu-foreground text-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Start your collection <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-border text-lg font-medium hover:bg-secondary transition-colors"
                >
                  Sign in
                </Link>
              </div>
            </div>
            <div className="relative aspect-square bg-zinc-900 overflow-hidden flex items-center justify-center group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-vu/10 to-transparent opacity-80"></div>
              <Disc className="w-64 h-64 text-vu/20 animate-[spin_20s_linear_infinite]" strokeWidth={0.5} />
              <div className="absolute bottom-8 left-8 right-8">
                <div className="flex justify-between items-end gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">Now Playing</p>
                    <p className="text-2xl font-playfair italic">Your Listening History</p>
                    <VuMeter className="mt-4 h-8" bars={14} />
                  </div>
                  <div className="h-12 w-12 border border-vu/40 flex items-center justify-center shrink-0">
                    <span className="text-xs font-mono text-vu">01</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-secondary py-32 px-6 md:px-12">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              <div className="space-y-6">
                <BarChart3 className="w-10 h-10 text-vu" strokeWidth={1.5} />
                <h3 className="text-2xl font-playfair font-bold">Deep Insights</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Go beyond surface-level stats. Analyze listening velocity, genre shifts, and obscure favorites with granular detail.
                </p>
              </div>
              <div className="space-y-6">
                <Share2 className="w-10 h-10 text-vu" strokeWidth={1.5} />
                <h3 className="text-2xl font-playfair font-bold">Editorial Exports</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Generate beautiful, print-quality recaps of your musical year. Designed to look as good as the music sounds.
                </p>
              </div>
              <div className="space-y-6">
                <Shield className="w-10 h-10 text-vu" strokeWidth={1.5} />
                <h3 className="text-2xl font-playfair font-bold">Privacy First</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Recaps and profiles are private until you publish them. Import, analyze, and delete your history at any time.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="py-32 px-6 md:px-12 border-y border-border">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-playfair italic leading-tight">
              &ldquo;Music is the shorthand of emotion.&rdquo;
            </h2>
            <p className="mt-6 text-sm uppercase tracking-[0.3em] text-muted-foreground">— Leo Tolstoy</p>
          </div>
        </section>
      </main>

      <footer className="px-6 py-12 md:px-12 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <Disc className="w-6 h-6 text-vu" />
            <span className="text-sm font-bold tracking-tighter uppercase font-playfair">Vinyl</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            © 2026 Vinyl Analytics. Built for the obsessive listener.
          </p>
          <div className="flex gap-6 text-[10px] uppercase tracking-widest font-bold">
            <Link href="#features" className="hover:text-vu">Features</Link>
            <Link href="/login" className="hover:text-vu">Sign in</Link>
            <a href="https://github.com/ayinlaaaa/vinyl" className="hover:text-vu">Github</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
