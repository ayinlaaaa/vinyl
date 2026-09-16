"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Loader2, AlertCircle, Disc } from "lucide-react";
import { signIn, signUp, signInAsGuest, type AuthFormState } from "@/app/actions/auth";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password";

const initial: AuthFormState = {};

export default function AuthForm({ mode, next, guestAllowed }: { mode: "login" | "signup"; next?: string; guestAllowed: boolean }) {
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, initial);
  const [guestState, guestAction, guestPending] = useActionState(signInAsGuest, initial);
  const error = state.error ?? guestState.error;

  const field = "w-full bg-secondary/40 border border-border px-4 py-3 text-sm outline-none focus:border-foreground/60 transition-colors";
  const label = "block text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2";

  return (
    <div className="w-full max-w-sm space-y-10">
      <div className="space-y-3">
        <Link href="/" className="inline-flex items-center gap-2">
          <Disc className="w-5 h-5" />
          <span className="text-sm font-bold tracking-tighter uppercase font-playfair">Vinyl</span>
        </Link>
        <h1 className="text-4xl font-playfair font-bold">
          {mode === "login" ? "Sign in." : "Start your archive."}
        </h1>
        <p className="text-sm text-muted-foreground">
          {mode === "login" ? (
            <>New here? <Link href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="underline hover:text-foreground">Create an account</Link>.</>
          ) : (
            <>Already have an account? <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="underline hover:text-foreground">Sign in</Link>.</>
          )}
        </p>
      </div>

      <form action={formAction} className="space-y-6">
        {next && <input type="hidden" name="next" value={next} />}
        {mode === "signup" && (
          <div>
            <label htmlFor="name" className={label}>Name <span className="opacity-50">(optional)</span></label>
            <input id="name" name="name" type="text" autoComplete="name" className={field} />
          </div>
        )}
        <div>
          <label htmlFor="email" className={label}>Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className={field} />
        </div>
        <div>
          <label htmlFor="password" className={label}>Password</label>
          <input
            id="password" name="password" type="password" required
            minLength={mode === "signup" ? MIN_PASSWORD_LENGTH : undefined}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className={field}
          />
          {mode === "signup" && (
            <p className="mt-2 text-[10px] font-mono text-muted-foreground">At least {MIN_PASSWORD_LENGTH} characters.</p>
          )}
        </div>

        {error && (
          <p role="alert" className="flex items-center gap-2 text-sm text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </p>
        )}

        <button
          type="submit" disabled={pending}
          className="w-full py-4 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {pending && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>

      {guestAllowed && (
        <form action={guestAction} className="border-t border-border pt-6">
          <button
            type="submit" disabled={guestPending}
            className="w-full py-3 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-secondary disabled:opacity-60 transition-colors"
          >
            {guestPending ? "Opening guest account…" : "Continue as guest (development only)"}
          </button>
          <p className="mt-3 text-[10px] font-mono text-muted-foreground text-center">
            Shared passwordless account. Enabled by ALLOW_GUEST_LOGIN.
          </p>
        </form>
      )}
    </div>
  );
}
