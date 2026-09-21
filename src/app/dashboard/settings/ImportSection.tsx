"use client";

import { useState } from "react";
import { Upload, FileJson, Loader2 } from "lucide-react";
import StatusMessage from "@/app/components/StatusMessage";
import { importListeningHistory, type ImportResult } from "@/app/actions/import";

export default function ImportSection() {
  const [isImporting, setIsImporting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string; details?: string[] } | null>(null);

  const describe = (result: ImportResult) => {
    const details: string[] = [];
    if (result.alreadyExisted > 0) details.push(`${result.alreadyExisted.toLocaleString()} already in your history (skipped)`);
    if (result.duplicatesInFile > 0) details.push(`${result.duplicatesInFile.toLocaleString()} duplicated inside the file (skipped)`);
    if (result.rejected > 0) details.push(`${result.rejected.toLocaleString()} unusable rows, e.g. ${result.rejectionSamples.join("; ")}`);
    return details;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setStatus(null);

    try {
      const text = await file.text();
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        setStatus({ type: "error", message: "That file is not valid JSON." });
        return;
      }
      const result = await importListeningHistory(json);

      if (result.success) {
        setStatus({
          type: "success",
          message: `Imported ${result.inserted.toLocaleString()} new plays.`,
          details: describe(result),
        });
      } else {
        setStatus({ type: "error", message: result.error || "Import failed.", details: describe(result) });
      }
    } catch {
      setStatus({ type: "error", message: "Upload failed. Please try again." });
    } finally {
      setIsImporting(false);
      e.target.value = "";
    }
  };

  const generateSample = async () => {
    setIsImporting(true);
    setStatus(null);
    // Deterministic sample so re-running the button doesn't create "new" plays every time.
    const sample = Array.from({ length: 50 }).map((_, i) => ({
      trackName: ["Creep", "Humble", "Get Lucky", "Borderline", "Windowlicker"][i % 5],
      artistName: ["Radiohead", "Kendrick Lamar", "Daft Punk", "Tame Impala", "Aphex Twin"][i % 5],
      ts: new Date(Date.UTC(2026, 0, 1, 12) + i * 7 * 3_600_000).toISOString(),
      ms_played: 180000 + (i % 7) * 9000,
    }));

    const result = await importListeningHistory(sample);
    setIsImporting(false);
    if (result.success) {
      setStatus({ type: "success", message: `Sample data: ${result.inserted} plays added (labelled as imported).`, details: describe(result) });
    } else {
      setStatus({ type: "error", message: result.error || "Sample import failed.", details: describe(result) });
    }
  };

  return (
    <section className="bg-secondary/30 border border-border p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Upload className="w-6 h-6 text-muted-foreground" />
        <h3 className="text-xl font-playfair font-bold">Import History</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Upload a Spotify data export (<span className="font-mono">Streaming_History_Audio_*.json</span> or{" "}
        <span className="font-mono">StreamingHistory*.json</span>). Re-importing the same file is safe: plays you already have are skipped.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-border hover:border-primary/50 transition-colors p-8 cursor-pointer group">
          {isImporting ? (
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
          <span className="mt-4 text-xs font-bold uppercase tracking-widest">Choose JSON File</span>
          <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} disabled={isImporting} />
        </label>

        <button 
          onClick={generateSample}
          disabled={isImporting}
          className="flex flex-col items-center justify-center border border-border hover:bg-secondary transition-colors p-8"
        >
          <FileJson className="w-8 h-8 text-muted-foreground" />
          <span className="mt-4 text-xs font-bold uppercase tracking-widest">Generate Sample Data</span>
        </button>
      </div>

      {status && (
        <StatusMessage type={status.type}>
          <p>{status.message}</p>
          {status.details && status.details.length > 0 && (
            <ul className="text-xs font-mono opacity-80 list-disc pl-4 space-y-1">
              {status.details.map((d) => <li key={d}>{d}</li>)}
            </ul>
          )}
        </StatusMessage>
      )}
    </section>
  );
}
