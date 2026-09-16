import { Play, Music, Clock, Disc, Database, Globe, Lock } from "lucide-react";
import { formatMinutes } from "@/lib/analytics";
import { getDashboardData } from "@/lib/data-service";
import DashboardCharts from "@/app/dashboard/components/DashboardCharts";
import Link from "next/link";
import { db } from "@/db";
import { recaps } from "@/db/schema";
import { requireUser } from "@/lib/auth/current-user";
import { eq, desc } from "drizzle-orm";

export default async function DashboardPage() {
  const user = await requireUser();
  const { stats, recent, isMock } = await getDashboardData();
  
  const savedRecaps = await db.query.recaps.findMany({
    where: eq(recaps.userId, user.id),
    orderBy: [desc(recaps.createdAt)],
  });

  return (
    <div className="p-8 md:p-12 space-y-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">Listener Overview</p>
          <h1 className="text-5xl font-playfair font-bold">Welcome back.</h1>
          {isMock && (
             <p className="mt-4 text-xs font-mono text-muted-foreground flex items-center gap-2">
               <Database className="w-3 h-3" /> DEMO MODE: NO DATA IMPORTED
             </p>
          )}
        </div>
        <div className="flex gap-4">
          <StatCard label="Total Plays" value={stats.totalPlays.toLocaleString()} />
          <StatCard
            label="Listening Time"
            value={formatMinutes(stats.totalMinutes)}
            note={
              stats.playsWithoutDuration > 0
                ? `${stats.playsWithoutDuration.toLocaleString()} plays have no duration data; this is a minimum.`
                : undefined
            }
          />
        </div>
      </div>

      {/* Wrapped CTA */}
      <Link 
        href="/dashboard/wrapped" 
        className="block bg-primary text-primary-foreground p-8 md:p-12 relative overflow-hidden group hover:opacity-95 transition-opacity"
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-60">High Fidelity Recap</p>
            <h2 className="text-4xl md:text-6xl font-playfair font-black leading-tight">
              YOUR YEAR <br /> IN HI-FI.
            </h2>
            <p className="text-lg opacity-80 font-playfair italic">Explore your 2026 listening journey.</p>
          </div>
          <div className="bg-primary-foreground text-primary px-8 py-4 text-xs font-bold uppercase tracking-widest flex items-center gap-2 group-hover:gap-4 transition-all">
            Open Recap <Disc className="w-4 h-4 animate-spin-slow" />
          </div>
        </div>
        {/* Decor */}
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-[2s]">
          <Disc className="w-64 h-64" />
        </div>
      </Link>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <DashboardCharts stats={stats} />
        
        {/* Top Artists Sidebar */}
        <div className="bg-secondary/30 border border-border p-8 space-y-8 flex flex-col">
          <h3 className="text-lg font-playfair font-bold flex items-center gap-2">
            <Music className="w-5 h-5 text-muted-foreground" />
            Heavy Rotation
          </h3>
          <div className="space-y-6 flex-1">
            {stats.topArtists.map((artist, i) => (
              <div key={artist.name} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                  <div>
                    <p className="text-sm font-bold group-hover:underline">{artist.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{artist.count} plays</p>
                  </div>
                </div>
                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                   <Play className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>
            ))}
          </div>
          <Link href="/dashboard/collection" className="w-full py-3 border border-border text-[10px] text-center uppercase tracking-widest font-bold hover:bg-secondary transition-colors mt-auto">
            Explore Collection
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-playfair font-bold">Recent History</h3>
            <Link href="/dashboard/history" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground hover:text-foreground underline">View Full Journal</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {recent.map((event, i) => (
              <div key={`${event.id}-${i}`} className="group cursor-pointer flex gap-4">
                <div className="w-24 h-24 bg-secondary flex-shrink-0 flex items-center justify-center relative overflow-hidden">
                  <Play className="w-8 h-8 text-white/20 group-hover:text-white transition-colors z-10" fill="currentColor" />
                  <Disc className="w-16 h-16 absolute text-muted-foreground/10" strokeWidth={0.5} />
                </div>
                <div className="flex flex-col justify-center">
                  <h4 className="font-bold text-lg truncate group-hover:underline">{event.trackName}</h4>
                  <p className="text-sm text-muted-foreground">{event.artistName}</p>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Recorded
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-playfair font-bold">Collections</h3>
          </div>
          <div className="space-y-4">
            {savedRecaps.map((recap) => (
              <Link 
                key={recap.id}
                href={`/recap/${recap.id}`}
                className="block p-6 border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors group"
              >
                <div className="flex items-center justify-between mb-2">
                   <p className="text-[10px] uppercase tracking-widest font-bold opacity-40">{recap.type}</p>
                   {recap.isPublic ? <Globe className="w-3 h-3 text-emerald-500" /> : <Lock className="w-3 h-3 text-muted-foreground" />}
                </div>
                <h4 className="text-xl font-playfair font-bold group-hover:underline">{recap.title}</h4>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-4">Saved {new Date(recap.createdAt).toLocaleDateString()}</p>
              </Link>
            ))}
            {savedRecaps.length === 0 && (
              <div className="py-12 border border-dashed border-border flex flex-col items-center justify-center text-center p-6 space-y-4">
                <Disc className="w-12 h-12 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground italic">Your saved recaps will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="bg-secondary/50 border border-border px-6 py-4 min-w-[160px]" title={note}>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      {note && <p className="text-[10px] font-mono text-muted-foreground mt-1">est. minimum</p>}
    </div>
  );
}
