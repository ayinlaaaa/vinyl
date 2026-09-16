"use client";

import { useState } from "react";
import { getSpotifyAuthUrl, syncSpotify, disconnectSpotify } from "@/app/actions/spotify";
import { Music, CheckCircle2, AlertCircle, Loader2, RefreshCw, Unlink, ExternalLink } from "lucide-react";

interface SpotifyConnectionProps {
  initialStatus: {
    isConnected: boolean;
    lastSynced?: Date | null;
  };
}

export default function SpotifyConnection({ initialStatus }: SpotifyConnectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error", message: string } | null>(null);
  const [isConnected, setIsConnected] = useState(initialStatus.isConnected);

  const handleConnect = async () => {
    setIsLoading(true);
    setStatus(null);
    const result = await getSpotifyAuthUrl();
    
    if (result.success && result.url) {
      window.location.href = result.url;
    } else {
      setStatus({ type: "error", message: result.error || "Failed to start Spotify connection." });
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    const result = await syncSpotify();
    if (result.success) {
      setStatus({ type: "success", message: `Synced ${result.count} recent plays from Spotify.` });
    } else {
      setStatus({ type: "error", message: result.error || "Sync failed." });
    }
    setIsLoading(false);
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Spotify? This won't delete your existing data.")) return;
    setIsLoading(true);
    await disconnectSpotify();
    setIsConnected(false);
    setIsLoading(false);
    setStatus({ type: "success", message: "Spotify disconnected." });
  };

  return (
    <section className="bg-secondary/30 border border-border p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Music className="w-6 h-6 text-[#1DB954]" />
          <h3 className="text-xl font-playfair font-bold">Spotify Integration</h3>
        </div>
        {isConnected && (
          <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-1 font-bold uppercase tracking-widest">Connected</span>
        )}
      </div>

      {!isConnected ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Connect your Spotify account to sync your recently played tracks. 
            Due to API limits, we can only retrieve your last 50 plays at a time.
          </p>
          <button 
            onClick={handleConnect}
            disabled={isLoading}
            className="px-6 py-2 bg-[#1DB954] text-white text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
            Connect Spotify
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border bg-secondary/50">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Status</p>
              <p className="font-bold">Active Connection</p>
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
                className="p-2 hover:bg-secondary transition-colors text-muted-foreground hover:text-rose-500"
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
