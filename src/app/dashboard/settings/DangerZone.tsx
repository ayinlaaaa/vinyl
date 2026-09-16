"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { clearAllData } from "@/app/actions/import";

export default function DangerZone() {
  const router = useRouter();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearData = async () => {
    if (!confirm("Delete ALL your listening history, saved recaps and provider connections? This cannot be undone.")) return;
    setIsClearing(true);
    await clearAllData();
    setIsClearing(false);
    router.refresh();
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
        disabled={isClearing}
        className="px-6 py-3 bg-rose-500 text-white text-[10px] uppercase tracking-widest font-bold hover:bg-rose-600 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
      >
        {isClearing && <Loader2 className="w-3 h-3 animate-spin" />}
        Clear All Data
      </button>
    </section>
  );
}
