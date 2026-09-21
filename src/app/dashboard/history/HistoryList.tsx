"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Search, Disc, Play } from "lucide-react";
import type { ListeningEvent } from "@/lib/listening";
import DataQualityNotice from "@/app/components/DataQualityNotice";

export default function HistoryList({ initialEvents, timezone }: { initialEvents: ListeningEvent[]; timezone?: string }) {
  const [searchTerm, setSearchTerm] = useState("");
  const estimatedCount = initialEvents.filter((event) => event.timestampEstimated || event.provider === "apple").length;
  const verifiedCount = initialEvents.length - estimatedCount;

  const filteredHistory = initialEvents.filter(event => 
    event.trackName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.artistName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <DataQualityNotice estimatedCount={estimatedCount} verifiedCount={verifiedCount} timezone={timezone} />
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Full Journal</p>
          <h1 className="text-5xl font-playfair font-bold">Listening History</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search history..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-secondary border border-border px-10 py-2 text-sm focus:ring-1 focus:ring-primary outline-none transition-all w-64"
            />
          </div>
        </div>
      </div>

      <div className="border border-border">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary/50 border-b border-border">
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Track</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Artist</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground hidden md:table-cell">Album</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Played At</th>
              <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Source</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map((event, i) => (
              <tr key={`${event.id}-${i}`} className="group hover:bg-secondary/30 transition-colors border-b border-border last:border-0">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary flex items-center justify-center relative overflow-hidden group-hover:bg-zinc-800 transition-colors">
                       <Play className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity absolute z-10" fill="currentColor" />
                       <Disc className="w-6 h-6 text-muted-foreground/30 group-hover:opacity-20" />
                    </div>
                    <span className="font-bold text-sm line-clamp-1">{event.trackName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  {event.artistName}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell line-clamp-1">
                  {event.albumName ?? <span className="opacity-40">—</span>}
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  <div className="flex flex-col">
                    <span className="whitespace-nowrap">{format(event.playedAt, "MMM d, yyyy")}</span>
                    <span className="text-[10px] font-mono uppercase opacity-60">{format(event.playedAt, "h:mm a")}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-[10px] font-mono uppercase text-muted-foreground/60">
                  {event.provider}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredHistory.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <Disc className="w-12 h-12 mx-auto text-muted-foreground/20" />
            <p className="text-muted-foreground italic">No matches found in your journal.</p>
          </div>
        )}
      </div>
    </div>
  );
}
