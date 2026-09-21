"use client";

import { useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import StatusMessage from "@/app/components/StatusMessage";
import { updateTimezone } from "@/app/actions/settings";
import { detectBrowserTimezone } from "@/lib/timezone";

export default function TimezoneSettings({ initialTimezone }: { initialTimezone: string }) {
  const [timezone, setTimezone] = useState(initialTimezone || "UTC");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    setStatus(null);
    setError(null);
    const result = await updateTimezone(timezone.trim());
    if (result.success) setStatus("Timezone saved. New analytics use it immediately.");
    else setError(result.error || "Could not save timezone.");
    setPending(false);
  }

  function useBrowserTimezone() {
    setTimezone(detectBrowserTimezone());
    setStatus(null);
    setError(null);
  }

  return (
    <section className="bg-secondary/30 border border-border p-8 space-y-6">
      <div className="flex items-center gap-3">
        <MapPin className="w-6 h-6 text-muted-foreground" />
        <div>
          <h3 className="text-xl font-playfair font-bold">Analytics timezone</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Weekdays, listening hours, and your recap vibe are calculated in this IANA timezone.
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={timezone}
          onChange={(event) => setTimezone(event.target.value)}
          aria-label="IANA timezone"
          placeholder="America/New_York"
          className="flex-1 bg-secondary border border-border px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
        />
        <button
          type="button"
          onClick={useBrowserTimezone}
          className="px-4 py-2 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-secondary transition-colors"
        >
          Use browser timezone
        </button>
        <button
          type="button"
          onClick={save}
          disabled={pending || !timezone.trim()}
          className="px-6 py-2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center gap-2"
        >
          {pending && <Loader2 className="w-3 h-3 animate-spin" />}
          Save
        </button>
      </div>
      <p className="text-[10px] font-mono text-muted-foreground">
        Use a named zone like Europe/London rather than a fixed UTC offset so daylight-saving changes stay accurate.
      </p>
      {status && <StatusMessage type="success">{status}</StatusMessage>}
      {error && <StatusMessage type="error">{error}</StatusMessage>}
    </section>
  );
}
