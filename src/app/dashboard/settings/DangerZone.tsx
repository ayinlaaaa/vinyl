"use client";

import { Trash2 } from "lucide-react";
import { clearAllData } from "@/app/actions/import";

export default function DangerZone() {
  const handleClearData = async () => {
    if (!confirm("Are you sure? This will delete all your imported listening history.")) return;
    await clearAllData();
    alert("All data cleared.");
  };

  return (
    <section className="border border-rose-500/20 p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Trash2 className="w-6 h-6 text-rose-500" />
        <h3 className="text-xl font-playfair font-bold text-rose-500">Danger Zone</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Permanently delete all your listening history and connected accounts. This action cannot be undone.
      </p>
      <button 
        onClick={handleClearData}
        className="px-6 py-3 bg-rose-500 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-rose-600 transition-colors"
      >
        Clear All Data
      </button>
    </section>
  );
}
