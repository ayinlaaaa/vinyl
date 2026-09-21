"use client";

import { useMemo, useState } from "react";
import { Disc, Grid, List as ListIcon, Play } from "lucide-react";
import { ARTIST_SORTS, isArtistSort, sortArtists, type ArtistSort } from "@/lib/collection-sort";

export default function CollectionList({ initialArtists }: { initialArtists: { name: string; count: number }[] }) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<ArtistSort>("plays-desc");

  const artists = useMemo(() => sortArtists(initialArtists, sort), [initialArtists, sort]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">My Library</p>
          <h1 className="text-4xl md:text-5xl font-playfair font-bold">Artists</h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex border border-border p-1">
            <button
              type="button"
              onClick={() => setView("grid")}
              aria-pressed={view === "grid"}
              aria-label="Grid view"
              className={`p-2 transition-colors ${view === "grid" ? "bg-secondary text-vu" : "hover:bg-secondary/50"}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              aria-label="List view"
              className={`p-2 transition-colors ${view === "list" ? "bg-secondary text-vu" : "hover:bg-secondary/50"}`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
            Sort
            <select
              value={sort}
              onChange={(event) => {
                if (isArtistSort(event.target.value)) setSort(event.target.value);
              }}
              className="bg-secondary border border-border px-3 py-2 text-sm font-medium tracking-normal normal-case"
            >
              {ARTIST_SORTS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className={view === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8" : "space-y-2"}>
        {artists.map((artist) => (
          <div
            key={artist.name}
            className={view === "grid"
              ? "group space-y-4"
              : "flex items-center justify-between p-4 border border-border hover:bg-secondary/30 transition-colors group"
            }
          >
            {view === "grid" ? (
              <>
                <div className="aspect-square bg-secondary relative overflow-hidden flex items-center justify-center rounded-full border-4 border-transparent group-hover:border-vu/40 transition-all">
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                    <Play className="w-10 h-10 text-vu" fill="currentColor" />
                  </div>
                  <Disc className="w-24 h-24 text-muted-foreground/20 group-hover:scale-110 transition-transform duration-700" strokeWidth={0.5} />
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-lg line-clamp-1">{artist.name}</h4>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{artist.count} scrobbles</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center shrink-0">
                    <Disc className="w-6 h-6 text-muted-foreground/30" strokeWidth={1} />
                  </div>
                  <h4 className="font-bold text-lg truncate">{artist.name}</h4>
                </div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold shrink-0">{artist.count} Plays</p>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
