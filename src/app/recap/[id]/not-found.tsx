import Link from "next/link";
import { Disc } from "lucide-react";

export default function RecapNotFound() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
      <Disc className="w-16 h-16 text-vu/40" />
      <h1 className="text-4xl font-playfair font-bold">This recap is private or does not exist.</h1>
      <p className="text-sm text-muted-foreground max-w-md">
        Public recaps are listed on a listener&apos;s profile when they choose to share one.
      </p>
      <Link
        href="/"
        className="inline-flex items-center px-6 py-3 border border-border hover:bg-secondary text-[10px] font-bold uppercase tracking-widest"
      >
        Back to Vinyl
      </Link>
    </main>
  );
}
