"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Disc, X, ChevronRight, ChevronLeft, Share2, Play, Globe, Lock,
  Copy, Check, Loader2,
} from "lucide-react";
import { WrappedData } from "@/lib/wrapped-service";
import { saveCurrentYearRecap, toggleRecapVisibility } from "@/app/actions/recaps";
import Link from "next/link";
import DataQualityNotice from "@/app/components/DataQualityNotice";
import VuMeter from "@/app/components/VuMeter";

export default function WrappedStory({
  data,
  initialId,
  initialIsPublic,
  mode = "editor",
  exitHref = "/dashboard",
  owner,
}: {
  data: WrappedData;
  initialId?: string;
  initialIsPublic?: boolean;
  mode?: "editor" | "viewer";
  exitHref?: string;
  owner?: { handle: string | null; name: string | null; profilePublic: boolean };
}) {
  const reduceMotion = useReducedMotion();
  const [recapId, setRecapId] = useState(initialId);
  const [isPublic, setIsPublic] = useState(initialIsPublic || false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const slides = [
    {
      id: "intro",
      content: (
        <div className="text-center space-y-8">
          <motion.div
            initial={reduceMotion ? false : { rotate: 0 }}
            animate={reduceMotion ? undefined : { rotate: 360 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Disc className="w-32 h-32 mx-auto text-vu" strokeWidth={1} />
          </motion.div>
          <VuMeter bars={16} className="justify-center h-12" />
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-vu">High Fidelity Recap</p>
            <h1 className="text-6xl md:text-8xl font-playfair font-black">VINYL <br /> {data.timePeriod}</h1>
          </div>
          <p className="text-muted-foreground italic font-playfair">Your musical year, analyzed.</p>
        </div>
      ),
    },
    {
      id: "minutes",
      content: (
        <div className="space-y-12">
          <p className="text-sm uppercase tracking-widest font-bold text-vu">The Numbers</p>
          <div className="space-y-4">
            <h2 className="text-7xl md:text-9xl font-playfair font-black tabular-nums">
              {data.totalMinutes.toLocaleString()}
            </h2>
            <p className="text-2xl font-playfair italic">minutes spent in your sonic world.</p>
          </div>
          <div className="h-1 bg-vu/20 w-full overflow-hidden">
            <motion.div
              className="h-full bg-vu"
              initial={reduceMotion ? { width: "100%" } : { width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: reduceMotion ? 0 : 2 }}
            />
          </div>
          <p className="text-lg text-muted-foreground">That&apos;s {data.totalPlays.toLocaleString()} total plays across {data.uniqueArtists} different artists.</p>
          <DataQualityNotice
            estimatedCount={data.estimatedTimestampCount ?? (data.containsEstimatedTimestamps ? data.totalPlays : 0)}
            verifiedCount={data.verifiedTimestampCount ?? (data.containsEstimatedTimestamps ? 0 : data.totalPlays)}
            timezone={data.timezone}
          />
          {data.playsWithoutDuration > 0 && (
            <p className="text-xs font-mono text-muted-foreground/70">
              Minimum figure: {data.playsWithoutDuration.toLocaleString()} plays had no duration data (Last.fm does not report it).
            </p>
          )}
        </div>
      ),
    },
    {
      id: "top-artists",
      content: (
        <div className="space-y-12 w-full max-w-xl">
          <p className="text-sm uppercase tracking-widest font-bold text-vu">Heavy Rotation</p>
          <h2 className="text-5xl font-playfair font-bold">Your Top Artists</h2>
          <div className="space-y-6">
            {data.topArtists.map((artist, i) => (
              <motion.div
                key={artist.name}
                initial={reduceMotion ? false : { x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: reduceMotion ? 0 : i * 0.1 }}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center gap-6">
                  <span className="text-4xl font-playfair italic text-vu/40">{i + 1}</span>
                  <span className="text-2xl font-bold group-hover:italic transition-all">{artist.name}</span>
                </div>
                <span className="text-xs font-mono opacity-40">{artist.count} plays</span>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "top-tracks",
      content: (
        <div className="space-y-12 w-full max-w-xl">
          <p className="text-sm uppercase tracking-widest font-bold text-vu">The Soundtrack</p>
          <h2 className="text-5xl font-playfair font-bold">Top Tracks</h2>
          <div className="space-y-4">
            {data.topTracks.map((track, i) => (
              <motion.div
                key={track.name}
                initial={reduceMotion ? false : { y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: reduceMotion ? 0 : i * 0.1 }}
                className="p-6 border border-border bg-secondary/30 flex items-center gap-6"
              >
                <div className="w-16 h-16 bg-zinc-900 flex-shrink-0 flex items-center justify-center">
                  <Play className="w-6 h-6 text-vu/40" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{track.name}</h3>
                  <p className="text-sm text-muted-foreground">{track.artist}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs font-mono opacity-40">{track.count}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "vibe",
      content: (
        <div className="text-center space-y-8">
          <p className="text-sm uppercase tracking-widest font-bold text-vu">Your Sonic Profile</p>
          <h2 className="text-6xl md:text-8xl font-playfair italic font-black text-vu">
            {data.listeningVibe}
          </h2>
          <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
            Based on the hour of day you listen most.
          </p>
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
            Sources: {data.sources?.join(", ") ?? "unknown"}
            {data.containsEstimatedTimestamps && " · Apple Music times are estimates"}
          </p>
        </div>
      ),
    },
    {
      id: "summary",
      content: (
        <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
          <div className="w-full max-w-md bg-white text-black p-10 space-y-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Disc className="w-32 h-32" />
            </div>
            <div className="h-1 w-16 bg-[#e8b84a]" />
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.4em] font-bold">Vinyl Recap {data.timePeriod}</p>
              <h3 className="text-4xl font-playfair font-black leading-none">MY YEAR IN <br /> HI-FI</h3>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-[10px] uppercase font-bold opacity-40 mb-2">Top Artists</p>
                <ul className="text-lg font-bold leading-tight">
                  {data.topArtists.slice(0, 3).map((a) => <li key={a.name}>{a.name}</li>)}
                </ul>
              </div>
              <div className="flex justify-between items-end border-t border-black/10 pt-6">
                <div>
                  <p className="text-2xl font-black">{data.totalMinutes.toLocaleString()}</p>
                  <p className="text-[10px] uppercase font-bold opacity-40">Minutes Listened</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-playfair italic font-black">{data.listeningVibe}</p>
                  <p className="text-[10px] uppercase font-bold opacity-40">Listening Profile</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-10">
              <div className="flex items-center gap-2">
                <Disc className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-tighter">Vinyl</span>
              </div>
              <p className="text-[10px] font-mono opacity-40">
                {owner?.handle && owner.profilePublic ? `/u/${owner.handle}` : "vinyl recap"}
              </p>
            </div>
          </div>

          <SharePanel
            mode={mode}
            recapId={recapId}
            isPublic={isPublic}
            isSaving={isSaving}
            isCopied={isCopied}
            shareError={shareError}
            data={data}
            onSave={async () => {
              setIsSaving(true);
              setShareError(null);
              const res = await saveCurrentYearRecap();
              if (res.success) {
                setRecapId(res.id);
                setIsPublic(res.isPublic);
              } else {
                setShareError(res.error || "Could not save recap.");
              }
              setIsSaving(false);
            }}
            onToggle={async () => {
              if (!recapId) return;
              const nextPublic = !isPublic;
              setIsPublic(nextPublic);
              const res = await toggleRecapVisibility(recapId, nextPublic);
              if (!res.success) {
                setIsPublic(!nextPublic);
                setShareError(res.error || "Could not update visibility.");
              }
            }}
            onCopy={() => {
              if (!recapId) return;
              const url = `${window.location.origin}/recap/${recapId}`;
              navigator.clipboard.writeText(url);
              setIsCopied(true);
              setTimeout(() => setIsCopied(false), 2000);
            }}
            onNativeShare={async () => {
              if (!recapId || !navigator.share) return;
              try {
                await navigator.share({
                  title: `VINYL ${data.timePeriod}`,
                  text: `${data.totalMinutes.toLocaleString()} minutes · ${data.listeningVibe}`,
                  url: `${window.location.origin}/recap/${recapId}`,
                });
              } catch {
                /* user cancelled */
              }
            }}
          />
        </div>
      ),
    },
  ];

  const lastIndex = slides.length - 1;
  const next = useCallback(() => setCurrentSlide((prev) => (prev + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && event.target.closest("button, a, input, textarea, select")) {
        return;
      }
      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        next();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const transition = reduceMotion ? { duration: 0 } : { duration: 0.45, ease: "easeOut" as const };

  return (
    <div
      className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden select-none"
      role="region"
      aria-roledescription="carousel"
      aria-label={`Vinyl ${data.timePeriod} recap`}
      onTouchStart={(event) => setTouchStart(event.changedTouches[0]?.clientX ?? null)}
      onTouchEnd={(event) => {
        if (touchStart === null) return;
        const delta = (event.changedTouches[0]?.clientX ?? touchStart) - touchStart;
        if (delta < -50) next();
        else if (delta > 50) prev();
        setTouchStart(null);
      }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 -left-20 w-96 h-96 border border-vu/30 rounded-full" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 border border-vu/20 rounded-full" />
      </div>

      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3 min-w-0">
          <Disc className="w-6 h-6 text-vu shrink-0" />
          <span className="text-sm font-bold tracking-tighter uppercase font-playfair">Vinyl</span>
          {mode === "viewer" && owner?.handle && owner.profilePublic && (
            <Link href={`/u/${owner.handle}`} className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-vu truncate">
              {owner.name || `@${owner.handle}`}
            </Link>
          )}
        </div>
        <Link href={exitHref} className="p-2 hover:bg-secondary transition-colors" aria-label="Close recap">
          <X className="w-6 h-6" />
        </Link>
      </div>

      <div className="absolute top-16 left-6 right-6 flex gap-1 z-20" aria-hidden="true">
        {slides.map((_, i) => (
          <div key={i} className="h-1 flex-1 bg-secondary overflow-hidden">
            <motion.div
              className="h-full bg-vu"
              initial={false}
              animate={{ width: i === currentSlide ? "100%" : i < currentSlide ? "100%" : "0%" }}
              transition={{ duration: reduceMotion ? 0 : 0.4 }}
            />
          </div>
        ))}
      </div>

      <div className="flex-1 w-full flex items-center justify-center relative">
        <p className="sr-only" aria-live="polite">
          Slide {currentSlide + 1} of {slides.length}
        </p>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -16 }}
            transition={transition}
            className="w-full flex justify-center relative z-10 px-2 md:px-16"
          >
            {slides[currentSlide].content}
          </motion.div>
        </AnimatePresence>

        <button
          type="button"
          aria-label="Previous slide"
          className="absolute left-0 top-0 bottom-0 w-[18%] z-[5] cursor-w-resize"
          onClick={prev}
        />
        <button
          type="button"
          aria-label="Next slide"
          className="absolute right-0 top-0 bottom-0 w-[18%] z-[5] cursor-e-resize"
          onClick={next}
        />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex items-center justify-between z-20">
        <button
          type="button"
          onClick={prev}
          className="p-3 md:p-4 hover:bg-secondary transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        {currentSlide === lastIndex ? (
          <div />
        ) : (
          <button
            type="button"
            onClick={next}
            className="px-6 md:px-8 py-3 md:py-4 bg-vu text-vu-foreground text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={next}
          className="p-3 md:p-4 hover:bg-secondary transition-colors"
          aria-label="Next"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}

function SharePanel({
  mode,
  recapId,
  isPublic,
  isSaving,
  isCopied,
  shareError,
  data,
  onSave,
  onToggle,
  onCopy,
  onNativeShare,
}: {
  mode: "editor" | "viewer";
  recapId?: string;
  isPublic: boolean;
  isSaving: boolean;
  isCopied: boolean;
  shareError: string | null;
  data: WrappedData;
  onSave: () => Promise<void>;
  onToggle: () => Promise<void>;
  onCopy: () => void;
  onNativeShare: () => Promise<void>;
}) {
  const canCopy = Boolean(recapId) && (mode === "viewer" || isPublic);
  const nativeShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator.share === "function",
    () => false,
  );

  return (
    <div className="w-full max-w-md space-y-4 relative z-20">
      {mode === "editor" && !recapId ? (
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="w-full py-4 bg-vu text-vu-foreground text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
          Save & Share Recap
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2">
            {mode === "editor" && recapId && (
              <button
                type="button"
                onClick={onToggle}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 border transition-colors ${
                  isPublic ? "bg-vu/10 border-vu/30 text-vu" : "bg-secondary border-border text-muted-foreground"
                }`}
              >
                {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {isPublic ? "Publicly Shared" : "Private"}
              </button>
            )}
            <button
              type="button"
              onClick={onCopy}
              disabled={!canCopy}
              className="px-6 py-3 bg-secondary border border-border text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
              aria-label="Copy recap link"
            >
              {isCopied ? <Check className="w-4 h-4 text-vu" /> : <Copy className="w-4 h-4" />}
            </button>
            {nativeShare && canCopy && (
              <button
                type="button"
                onClick={onNativeShare}
                className="px-6 py-3 bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
                aria-label={`Share VINYL ${data.timePeriod}`}
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}
          </div>
          {mode === "editor" && isPublic && (
            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">
              Anyone with the link can view your recap.
            </p>
          )}
          {mode === "viewer" && (
            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">
              A public Vinyl recap.
            </p>
          )}
        </div>
      )}
      {shareError && (
        <p role="alert" className="text-xs text-destructive text-center">{shareError}</p>
      )}
    </div>
  );
}
