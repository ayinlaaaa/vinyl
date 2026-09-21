import Link from "next/link";
import { Disc } from "lucide-react";

export default function ProfileNotFound() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
      <Disc className="w-16 h-16 text-vu/40" />
      <h1 className="text-4xl font-playfair font-bold">This profile is private or does not exist.</h1>
      <Link
        href="/"
        className="inline-flex items-center px-6 py-3 border border-border hover:bg-secondary text-[10px] font-bold uppercase tracking-widest"
      >
        Back to Vinyl
      </Link>
    </main>
  );
}
