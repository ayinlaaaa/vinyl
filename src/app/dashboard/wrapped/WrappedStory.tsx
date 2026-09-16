"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Disc, X, ChevronRight, ChevronLeft, Share2, Play, Globe, Lock, Copy, Check, Loader2 } from "lucide-react";
import { WrappedData } from "@/lib/wrapped-service";
import { saveCurrentYearRecap, toggleRecapVisibility } from "@/app/actions/recaps";
import Link from "next/link";

export default function WrappedStory({ data, initialId, initialIsPublic }: { data: WrappedData, initialId?: string, initialIsPublic?: boolean }) {
  const [recapId, setRecapId] = useState(initialId);
  const [isPublic, setIsPublic] = useState(initialIsPublic || false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: "intro",
      content: (
        <div className="text-center space-y-8">
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            <Disc className="w-32 h-32 mx-auto text-primary" strokeWidth={1} />
          </motion.div>
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-60">High Fidelity Recap</p>
            <h1 className="text-6xl md:text-8xl font-playfair font-black">VINYL <br /> {data.timePeriod}</h1>
          </div>
          <p className="text-muted-foreground italic font-playfair">Your musical year, analyzed.</p>
        </div>
      )
    },
    {
      id: "minutes",
      content: (
        <div className="space-y-12">
          <p className="text-sm uppercase tracking-widest font-bold opacity-60">The Numbers</p>
          <div className="space-y-4">
            <h2 className="text-7xl md:text-9xl font-playfair font-black tabular-nums">
              {data.totalMinutes.toLocaleString()}
            </h2>
            <p className="text-2xl font-playfair italic">minutes spent in your sonic world.</p>
          </div>
          <div className="h-1 bg-primary/20 w-full overflow-hidden">
             <motion.div 
               className="h-full bg-primary" 
               initial={{ width: 0 }} 
               animate={{ width: "100%" }} 
               transition={{ duration: 2 }} 
             />
          </div>
          <p className="text-lg text-muted-foreground">That's {data.totalPlays.toLocaleString()} total plays across {data.uniqueArtists} different artists.</p>
        </div>
      )
    },
    {
      id: "top-artists",
      content: (
        <div className="space-y-12 w-full max-w-xl">
          <p className="text-sm uppercase tracking-widest font-bold opacity-60">Heavy Rotation</p>
          <h2 className="text-5xl font-playfair font-bold">Your Top Artists</h2>
          <div className="space-y-6">
            {data.topArtists.map((artist, i) => (
              <motion.div 
                key={artist.name}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between group"
              >
                <div className="flex items-center gap-6">
                  <span className="text-4xl font-playfair italic opacity-20">{i + 1}</span>
                  <span className="text-2xl font-bold group-hover:italic transition-all">{artist.name}</span>
                </div>
                <span className="text-xs font-mono opacity-40">{artist.count} plays</span>
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "top-tracks",
      content: (
        <div className="space-y-12 w-full max-w-xl">
          <p className="text-sm uppercase tracking-widest font-bold opacity-60">The Soundtrack</p>
          <h2 className="text-5xl font-playfair font-bold">Top Tracks</h2>
          <div className="space-y-4">
             {data.topTracks.map((track, i) => (
               <motion.div 
                 key={track.name}
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: i * 0.1 }}
                 className="p-6 border border-border bg-secondary/30 flex items-center gap-6"
               >
                 <div className="w-16 h-16 bg-zinc-900 flex-shrink-0 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white/20" />
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
      )
    },
    {
      id: "vibe",
      content: (
        <div className="text-center space-y-8">
           <p className="text-sm uppercase tracking-widest font-bold opacity-60">Your Sonic Profile</p>
           <h2 className="text-6xl md:text-8xl font-playfair italic font-black text-primary">
             {data.listeningVibe}
           </h2>
           <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
             Based on your peak listening hours and genre diversity, you belong to the elite circle of {data.listeningVibe}s.
           </p>
        </div>
      )
    },
    {
      id: "summary",
      content: (
        <div className="flex flex-col items-center gap-8 w-full max-w-4xl">
          <div className="w-full max-w-md bg-white text-black p-10 space-y-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Disc className="w-32 h-32" />
            </div>
            <div className="space-y-2">
               <p className="text-[10px] uppercase tracking-[0.4em] font-bold">Vinyl Recap {data.timePeriod}</p>
               <h3 className="text-4xl font-playfair font-black leading-none">MY YEAR IN <br /> HI-FI</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <p className="text-[10px] uppercase font-bold opacity-40 mb-2">Top Artists</p>
                <ul className="text-lg font-bold leading-tight">
                  {data.topArtists.slice(0, 3).map(a => <li key={a.name}>{a.name}</li>)}
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
              <p className="text-[10px] font-mono opacity-40 underline">vinyl.audio/recap</p>
            </div>
          </div>

          {/* Sharing Controls */}
          <div className="w-full max-w-md space-y-4 pointer-events-auto">
            {!recapId ? (
              <button 
                onClick={async () => {
                  setIsSaving(true);
                  const res = await saveCurrentYearRecap();
                  if (res.success) setRecapId(res.id);
                  setIsSaving(false);
                }}
                disabled={isSaving}
                className="w-full py-4 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                Save & Share Recap
              </button>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      const nextPublic = !isPublic;
                      setIsPublic(nextPublic);
                      await toggleRecapVisibility(recapId, nextPublic);
                    }}
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 border transition-colors ${
                      isPublic ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-secondary border-border text-muted-foreground"
                    }`}
                  >
                    {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    {isPublic ? "Publicly Shared" : "Private"}
                  </button>
                  <button 
                    onClick={() => {
                      const url = `${window.location.origin}/recap/${recapId}`;
                      navigator.clipboard.writeText(url);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    disabled={!isPublic}
                    className="px-6 py-3 bg-secondary border border-border text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {isPublic && (
                  <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest">
                    Anyone with the link can view your recap.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )
    }
  ];

  const next = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prev = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden select-none">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
         <div className="absolute top-1/4 -left-20 w-96 h-96 border border-border rounded-full" />
         <div className="absolute bottom-1/4 -right-20 w-96 h-96 border border-border rounded-full" />
      </div>

      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-10">
         <div className="flex items-center gap-2">
            <Disc className="w-6 h-6" />
            <span className="text-sm font-bold tracking-tighter uppercase font-playfair">Vinyl</span>
         </div>
         <Link href="/dashboard" className="p-2 hover:bg-secondary transition-colors">
            <X className="w-6 h-6" />
         </Link>
      </div>

      {/* Progress Bars */}
      <div className="absolute top-16 left-6 right-6 flex gap-1 z-10">
        {slides.map((_, i) => (
          <div key={i} className="h-1 flex-1 bg-secondary overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: i === currentSlide ? "100%" : i < currentSlide ? "100%" : "0%" }}
              transition={{ duration: 0.5 }}
            />
          </div>
        ))}
      </div>

      {/* Slide Content */}
      <div className="flex-1 w-full flex items-center justify-center relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full flex justify-center"
          >
            {slides[currentSlide].content}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Areas */}
        <div className="absolute inset-0 flex">
          <div className="flex-1 cursor-w-resize" onClick={prev} />
          <div className="flex-1 cursor-e-resize" onClick={next} />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 flex items-center justify-between pointer-events-none">
        <button 
          onClick={prev} 
          className="p-4 hover:bg-secondary transition-colors pointer-events-auto"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        
        {currentSlide === slides.length - 1 ? (
          <div /> // Hide the floating share button on summary slide as it has its own controls
        ) : (
          <button 
             onClick={next}
             className="px-8 py-4 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center gap-2 pointer-events-auto"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        )}

        <button 
          onClick={next} 
          className="p-4 hover:bg-secondary transition-colors pointer-events-auto"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}
