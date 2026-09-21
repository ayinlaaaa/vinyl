"use client";

import { useState } from "react";
import { Globe, Loader2 } from "lucide-react";
import { updateProfile } from "@/app/actions/settings";
import StatusMessage from "@/app/components/StatusMessage";
import Link from "next/link";

export default function PrivacySettings({
  initialName,
  initialHandle,
  initialProfilePublic,
  initialRecapsPublicByDefault,
}: {
  initialName: string | null;
  initialHandle: string | null;
  initialProfilePublic: boolean;
  initialRecapsPublicByDefault: boolean;
}) {
  const [name, setName] = useState(initialName ?? "");
  const [handle, setHandle] = useState(initialHandle ?? "");
  const [profilePublic, setProfilePublic] = useState(initialProfilePublic);
  const [recapsPublicByDefault, setRecapsPublicByDefault] = useState(initialRecapsPublicByDefault);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function save() {
    setPending(true);
    setError(null);
    setStatus(null);
    const result = await updateProfile({
      name,
      handle,
      profilePublic,
      recapsPublicByDefault,
    });
    if (result.success) {
      setStatus("Profile and privacy settings saved.");
      if (result.handle) setHandle(result.handle);
      setProfilePublic(result.profilePublic);
    } else {
      setError(result.error || "Could not save profile.");
    }
    setPending(false);
  }

  const previewHandle = handle.trim().toLowerCase();

  return (
    <section className="bg-secondary/30 border border-border p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Globe className="w-6 h-6 text-vu" />
        <div>
          <h3 className="text-xl font-playfair font-bold">Profile & privacy</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Public recaps stay reachable by direct link even if your profile is private.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="display-name" className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
          Display name
        </label>
        <input
          id="display-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          className="w-full bg-secondary border border-border px-4 py-2 text-sm focus:ring-1 focus:ring-vu outline-none"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="handle" className="block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
          Public handle
        </label>
        <div className="flex items-center border border-border bg-secondary">
          <span className="px-3 text-xs font-mono text-muted-foreground">/u/</span>
          <input
            id="handle"
            value={handle}
            onChange={(event) => setHandle(event.target.value)}
            placeholder="your-name"
            autoComplete="off"
            spellCheck={false}
            className="flex-1 bg-transparent px-2 py-2 text-sm focus:ring-0 outline-none"
          />
        </div>
        <p className="text-[10px] font-mono text-muted-foreground">
          3–24 characters. Letters, numbers, and hyphens.
        </p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={profilePublic}
          onChange={(event) => setProfilePublic(event.target.checked)}
          className="mt-1 accent-[#e8b84a]"
        />
        <span>
          <span className="block text-sm font-medium">Make profile public</span>
          <span className="block text-xs text-muted-foreground">
            Lists your public recaps at /u/{previewHandle || "handle"}. Requires a handle.
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={recapsPublicByDefault}
          onChange={(event) => setRecapsPublicByDefault(event.target.checked)}
          className="mt-1 accent-[#e8b84a]"
        />
        <span>
          <span className="block text-sm font-medium">New recaps start public</span>
          <span className="block text-xs text-muted-foreground">
            Applies the next time you save a yearly recap. Already-saved recaps keep their current visibility.
          </span>
        </span>
      </label>

      {previewHandle && (
        <p className="text-xs text-muted-foreground">
          Preview:{" "}
          <Link href={`/u/${previewHandle}`} className="text-vu underline underline-offset-4">
            /u/{previewHandle}
          </Link>
          {!profilePublic && " (only you can see it while the profile is private)"}
        </p>
      )}

      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="px-6 py-2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-60 transition-opacity inline-flex items-center gap-2"
      >
        {pending && <Loader2 className="w-3 h-3 animate-spin" />}
        Save profile
      </button>

      {status && <StatusMessage type="success">{status}</StatusMessage>}
      {error && <StatusMessage type="error">{error}</StatusMessage>}
    </section>
  );
}
