"use client";

import { useState } from "react";
import { Upload, FileJson, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { importListeningHistory } from "@/app/actions/import";

export default function ImportSection() {
  const [isImporting, setIsImporting] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error", message: string } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setStatus(null);

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const result = await importListeningHistory(Array.isArray(json) ? json : [json]);
      
      if (result.success) {
        setStatus({ type: "success", message: `Successfully imported ${result.count} tracks.` });
      } else {
        setStatus({ type: "error", message: result.error || "Import failed." });
      }
    } catch (err) {
      setStatus({ type: "error", message: "Invalid JSON file." });
    } finally {
      setIsImporting(false);
    }
  };

  const generateSample = async () => {
    setIsImporting(true);
    const sample = Array.from({ length: 50 }).map((_, i) => ({
      trackName: ["Creep", "Humble", "Get Lucky", "Borderline", "Windowlicker"][i % 5],
      artistName: ["Radiohead", "Kendrick Lamar", "Daft Punk", "Tame Impala", "Aphex Twin"][i % 5],
      ts: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
      ms_played: 180000 + Math.random() * 60000
    }));
    
    const result = await importListeningHistory(sample);
    setIsImporting(false);
    if (result.success) setStatus({ type: "success", message: "Sample data generated." });
  };

  return (
    <section className="bg-secondary/30 border border-border p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Upload className="w-6 h-6 text-muted-foreground" />
        <h3 className="text-xl font-playfair font-bold">Import History</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Upload your listening history from Spotify, Apple Music, or Last.fm. 
        We currently support standard JSON exports.
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
        <div className={`flex items-center gap-3 p-4 text-sm font-medium ${
          status.type === "success" ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
        }`}>
          {status.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {status.message}
        </div>
      )}
    </section>
  );
}
