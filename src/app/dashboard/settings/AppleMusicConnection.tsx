"use client";

import { useState, useEffect } from "react";
import { connectAppleMusic, syncAppleMusic, disconnectAppleMusic } from "@/app/actions/apple";
import { getAppleDeveloperToken } from "@/app/actions/apple-auth";
import { Apple, Loader2, RefreshCw, Unlink, ExternalLink } from "lucide-react";
import StatusMessage from "@/app/components/StatusMessage";

interface AppleMusicConnectionProps {
  initialStatus: {
    isConnected: boolean;
    lastSynced?: Date | null;
  };
}

/** Minimal typing for the parts of MusicKit JS v3 we use. */
interface MusicKitInstance {
  authorize(): Promise<string>;
}
interface MusicKitGlobal {
  configure(config: { developerToken: string; app: { name: string; build: string } }): Promise<MusicKitInstance>;
}

declare global {
  interface Window {
    MusicKit?: MusicKitGlobal;
  }
}

export default function AppleMusicConnection({ initialStatus }: AppleMusicConnectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error", message: string } | null>(null);
  const [isConnected, setIsConnected] = useState(initialStatus.isConnected);

  useEffect(() => {
    // Load MusicKit JS
    if (!window.MusicKit) {
      const script = document.createElement("script");
      script.src = "https://js-cdn.music.apple.com/musickit/v3/musickit.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    setStatus(null);

    try {
      const devToken = await getAppleDeveloperToken();
      if (!devToken) {
        throw new Error("Apple Developer Token not configured on server.");
      }

      if (!window.MusicKit) {
        throw new Error("MusicKit JS failed to load.");
      }

      const music = await window.MusicKit.configure({
        developerToken: devToken,
        app: {
          name: "Vinyl",
          build: "1.0.0",
        },
      });

      const musicUserToken = await music.authorize();
      
      const result = await connectAppleMusic(musicUserToken);
      if (result.success) {
        setIsConnected(true);
        setStatus({ type: "success", message: "Connected to Apple Music." });
      } else {
        setStatus({ type: "error", message: result.error || "Connection failed." });
      }
    } catch (err: unknown) {
      console.error(err);
      setStatus({ type: "error", message: err instanceof Error ? err.message : "Failed to connect to Apple Music." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    const result = await syncAppleMusic();
    if (result.success) {
      setStatus({ type: "success", message: `Synced ${result.count} new tracks from Apple Music.` });
    } else {
      setStatus({ type: "error", message: result.error || "Sync failed." });
    }
    setIsLoading(false);
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Apple Music?")) return;
    setIsLoading(true);
    await disconnectAppleMusic();
    setIsConnected(false);
    setIsLoading(false);
    setStatus({ type: "success", message: "Apple Music disconnected." });
  };

  return (
    <section className="bg-secondary/30 border border-border p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Apple className="w-6 h-6 text-foreground" />
          <h3 className="text-xl font-playfair font-bold">Apple Music Integration</h3>
        </div>
        {isConnected && (
          <span className="text-[10px] bg-vu/10 text-vu px-2 py-1 font-bold uppercase tracking-widest">Connected</span>
        )}
      </div>

      {!isConnected ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Link your Apple Music account via MusicKit. <strong className="text-foreground">Limitation:</strong> Apple&apos;s
            API lists recently played songs but gives no play times or counts, so each sync records
            those songs once with an estimated time. Treat Apple Music data as approximate.
          </p>
          <button 
            onClick={handleConnect}
            disabled={isLoading}
            className="px-6 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
            Connect Apple Music
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
