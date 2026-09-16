import { getHistoryData } from "@/lib/data-service";
import HistoryList from "./HistoryList";
import { Database } from "lucide-react";

export default async function HistoryPage() {
  const { events, isMock } = await getHistoryData();

  return (
    <div className="p-8 md:p-12 space-y-8 max-w-7xl mx-auto">
      {isMock && (
        <div className="bg-secondary/50 border border-border p-4 flex items-center justify-between">
          <p className="text-xs font-mono text-muted-foreground flex items-center gap-2">
            <Database className="w-3 h-3" /> DEMO MODE: Showing generated sample history.
          </p>
          <a href="/dashboard/settings" className="text-[10px] uppercase tracking-widest font-bold underline">Import Your Data</a>
        </div>
      )}
      <HistoryList initialEvents={events} />
    </div>
  );
}
