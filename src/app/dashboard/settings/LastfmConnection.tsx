"use client";

import { useState } from "react";
import { connectLastfm, syncLastfm, disconnectLastfm } from "@/app/actions/lastfm";
import { Disc, Loader2, RefreshCw, Unlink } from "lucide-react";
import StatusMessage from "@/app/components/StatusMessage";

interface LastfmConnectionProps {
  initialStatus: {
    isConnected: boolean;
    username?: string;
    lastSynced?: Date | null;
  };
}

export default function LastfmConnection({ initialStatus }: LastfmConnectionProps) {
  const [username, setUsername] = useState(initialStatus.username || "");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error", message: string } | null>(null);
  const [isConnected, setIsConnected] = useState(initialStatus.isConnected);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    setIsLoading(true);
    setStatus(null);

    const result = await connectLastfm(username);
    if (result.success) {
      setIsConnected(true);
      setStatus({ type: "success", message: "Connected to Last.fm successfully." });
    } else {
      setStatus({ type: "error", message: result.error || "Connection failed." });
    }
    setIsLoading(false);
  };

  const handleSync = async () => {
    setIsLoading(true);
    const result = await syncLastfm();
    if (result.success) {
      setStatus({ type: "success", message: `Synced ${result.count} new tracks.` });
    } else {
      setStatus({ type: "error", message: result.error || "Sync failed." });
    }
    setIsLoading(false);
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Last.fm? This won't delete your existing data.")) return;
    setIsLoading(true);
    await disconnectLastfm();
    setIsConnected(false);
    setIsLoading(false);
    setStatus({ type: "success", message: "Last.fm disconnected." });
  };

  return (
    <section className="bg-secondary/30 border border-border p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Disc className="w-6 h-6 text-muted-foreground" />
          <h3 className="text-xl font-playfair font-bold">Last.fm Integration</h3>
        </div>
        {isConnected && (
          <span className="text-[10px] bg-vu/10 text-vu px-2 py-1 font-bold uppercase tracking-widest">Connected</span>
        )}
      </div>

      {!isConnected ? (
        <form onSubmit={handleConnect} className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Link your Last.fm account to sync your scrobbles from your public profile. Note: Last.fm does not report track durations, so listening time from this source is unknown.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input 
              type="text" 
              placeholder="Last.fm Username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1 bg-secondary border border-border px-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none"
              required
            />
            <button 
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              Connect Account
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border bg-secondary/50">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Active Account</p>
              <p className="font-bold">{username}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleSync}
                disabled={isLoading}
                className="p-2 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                title="Sync Tracks"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <button 
                onClick={handleDisconnect}
                disabled={isLoading}
                className="p-2 hover:bg-secondary transition-colors text-muted-foreground hover:text-destructive"
                title="Disconnect"
              >
                <Unlink className="w-4 h-4" />
              </button>
            </div>
          </div>
          {initialStatus.lastSynced && (
             <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
               Last Synced: {new Date(initialStatus.lastSynced).toLocaleString()}
             </p>
          )}
        </div>
      )}

      {status && <StatusMessage type={status.type}>{status.message}</StatusMessage>}
    </section>
  );
}
