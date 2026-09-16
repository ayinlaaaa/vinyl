import { getOrCreateDefaultUser } from "@/lib/db-utils";
import { generateWrappedData } from "@/lib/wrapped-service";
import WrappedStory from "./WrappedStory";
import Link from "next/link";
import { ArrowLeft, Disc } from "lucide-react";
import { db } from "@/db";
import { recaps } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export default async function WrappedPage() {
  const user = await getOrCreateDefaultUser();
  const currentYear = new Date().getFullYear();

  try {
    const data = await generateWrappedData(user.id, currentYear);
    
    const existing = await db.query.recaps.findFirst({
      where: and(
        eq(recaps.userId, user.id),
        eq(recaps.type, "yearly"),
        eq(recaps.title, `Vinyl ${currentYear}`)
      )
    });

    return (
      <WrappedStory 
        data={data} 
        initialId={existing?.id} 
        initialIsPublic={existing?.isPublic} 
      />
    );
  } catch (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-8">
        <Disc className="w-20 h-20 text-muted-foreground/20 animate-pulse" />
        <div className="space-y-4 max-w-md">
          <h1 className="text-4xl font-playfair font-bold">Not enough data yet.</h1>
          <p className="text-muted-foreground leading-relaxed">
            We need more listening history to generate your Vinyl Recap. 
            Connect a service or import some files to get started.
          </p>
        </div>
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 px-6 py-3 border border-border hover:bg-secondary transition-colors text-sm font-bold uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }
}
