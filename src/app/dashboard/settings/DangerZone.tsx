"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, UserX } from "lucide-react";
import { clearAllData } from "@/app/actions/import";
import { deleteAccount } from "@/app/actions/settings";
import StatusMessage from "@/app/components/StatusMessage";

export default function DangerZone({ isGuest }: { isGuest: boolean }) {
  const router = useRouter();
  const [isClearing, setIsClearing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleClearData = async () => {
    if (!window.confirm("Delete ALL your listening history, saved recaps and provider connections? This cannot be undone.")) return;
    setIsClearing(true);
    await clearAllData();
    setIsClearing(false);
    router.refresh();
  };

  const handleDeleteAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsDeleting(true);
    const formData = new FormData();
    formData.set("confirm", confirm);
    formData.set("password", password);
    const result = await deleteAccount(formData);
    if (result?.error) {
      setError(result.error);
      setIsDeleting(false);
    }
  };

  return (
    <section className="border border-destructive/30 p-8 space-y-8">
      <div className="flex items-center gap-3">
        <Trash2 className="w-6 h-6 text-destructive" />
        <h3 className="text-xl font-playfair font-bold text-destructive">Danger Zone</h3>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Permanently delete all your listening history, saved recaps, and connected accounts. Your login stays.
        </p>
        <button
          onClick={handleClearData}
          disabled={isClearing}
          className="px-6 py-3 border border-destructive/40 text-destructive text-[10px] uppercase tracking-widest font-bold hover:bg-destructive/10 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
        >
          {isClearing && <Loader2 className="w-3 h-3 animate-spin" />}
          Clear All Data
        </button>
      </div>

      <div className="border-t border-destructive/20 pt-8 space-y-4">
        <div className="flex items-center gap-3">
          <UserX className="w-5 h-5 text-destructive" />
          <h4 className="font-playfair font-bold">Delete account</h4>
        </div>
        {isGuest ? (
          <p className="text-sm text-muted-foreground">
            The shared guest account cannot be deleted.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              This removes your account, sessions, history, recaps, and provider tokens. Type DELETE to confirm.
            </p>
            <form onSubmit={handleDeleteAccount} className="space-y-3 max-w-md">
              <input
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="DELETE"
                aria-label="Type DELETE to confirm"
                className="w-full bg-secondary border border-border px-4 py-2 text-sm focus:ring-1 focus:ring-destructive outline-none"
              />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Current password"
                autoComplete="current-password"
                aria-label="Current password"
                className="w-full bg-secondary border border-border px-4 py-2 text-sm focus:ring-1 focus:ring-destructive outline-none"
              />
              <button
                type="submit"
                disabled={isDeleting || confirm !== "DELETE"}
                className="px-6 py-3 bg-destructive text-destructive-foreground text-[10px] uppercase tracking-widest font-bold hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                Delete my account
              </button>
            </form>
            {error && <StatusMessage type="error">{error}</StatusMessage>}
          </>
        )}
      </div>
    </section>
  );
}
